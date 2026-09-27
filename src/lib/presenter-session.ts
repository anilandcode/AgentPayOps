import {createHmac,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
const cookieName="agentpayops_presenter";
function secret(){const value=process.env.PRESENTER_RESET_SECRET;if(!value||value.length<20)return null;return value;}
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
function sign(value:string,key:string){return createHmac("sha256",key).update(value).digest("hex")}
export function validPresenterSecret(candidate:string){const value=secret();return Boolean(value&&candidate.length<=200&&equal(sign(candidate,"presenter-check"),sign(value,"presenter-check")))}
export async function startPresenterSession(){const key=secret();if(!key)throw new Error("Presenter reset is not configured.");const expiry=Date.now()+30*60*1000;const nonce=crypto.randomUUID();const content=`${expiry}.${nonce}`;const value=`${content}.${sign(content,key)}`;(await cookies()).set(cookieName,value,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/api/demo",maxAge:1800});}
export async function hasPresenterSession(){const key=secret(),value=(await cookies()).get(cookieName)?.value;if(!key||!value)return false;const segments=value.split(".");if(segments.length!==3)return false;const content=`${segments[0]}.${segments[1]}`;return Number(segments[0])>Date.now()&&equal(segments[2],sign(content,key));}

(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,164674,e=>{"use strict";var t=e.i(843476),r=e.i(500932),u=e.i(575056),a=e.i(94800),i=e.i(848546),l=e.i(271645),n=e.i(190072);let o=1.15*.1,s=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,v=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,c=`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform vec2 uOldCursor;
  uniform vec2 uDelta;
  uniform float uNumSteps;
  uniform float uAmountPerStep;
  uniform float uRadiusSq;
  uniform float uInfluenceRadiusSq;
  uniform float uAspect;
  uniform float uFadeRate;
  uniform float uAgeRate;
  uniform float uShrink;
  uniform float uActive;

  void main() {
    vec4 prev = texture2D(uPrev, vUv);
    float intensity = prev.x * uFadeRate;
    float age = min(prev.z + uAgeRate, 1.0);
    float added = 0.0;
    if (uActive > 0.5) {
      for (int s = 0; s < 20; s++) {
        if (float(s) >= uNumSteps) break;
        float t = (float(s) + 0.5) / uNumSteps;
        vec2 d = vUv - (uOldCursor + uDelta * t);
        if (uAspect >= 1.0) d.x *= uAspect; else d.y /= uAspect;
        float distSq = dot(d, d);
        if (distSq < uInfluenceRadiusSq) {
          added += exp(-distSq / uRadiusSq) * uAmountPerStep;
        }
      }
    }
    float newIntensity = min(intensity + added, 1.0);
    float stamped = step(1e-5, added);
    float size = mix(1.0 - (1.0 - newIntensity) * uShrink, 1.0, stamped);
    float newAge = mix(age, 0.0, stamped);
    gl_FragColor = vec4(newIntensity, size, newAge, 1.0);
  }
`,f=`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform vec2 uCursor;
  uniform vec2 uVel;
  uniform float uMoving;
  uniform float uRadiusSq;
  uniform float uRadius2Sq;
  uniform float uAspect;
  uniform float uDecay;
  uniform float uIntensity;
  uniform float uDt;

  void main() {
    vec2 d = texture2D(uPrev, vUv).xy * (1.0 - uDecay * uDt);
    vec2 dd = vUv - uCursor;
    if (uAspect >= 1.0) dd.x *= uAspect; else dd.y /= uAspect;
    float distSq = dot(dd, dd);
    if (distSq < uRadius2Sq && uMoving > 0.5) {
      d += uVel * (exp(-distSq / uRadiusSq) * uIntensity * uDt * 0.5);
    }
    gl_FragColor = vec4(clamp(d, -1.0, 1.0), 0.0, 1.0);
  }
`,d=`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uHasTexture;
  uniform float uImageAspect;
  uniform float uPlaneAspect;
  uniform sampler2D uTrail;
  uniform sampler2D uDist;
  uniform float uStrength;
  uniform float uGridSize;
  uniform float uTrailPx;

  vec2 coverUv(vec2 uv) {
    if (uImageAspect > uPlaneAspect) {
      return vec2((uv.x - 0.5) * (uPlaneAspect / uImageAspect) + 0.5, uv.y);
    }
    return vec2(uv.x, (uv.y - 0.5) * (uImageAspect / uPlaneAspect) + 0.5);
  }

  float trailMask(vec2 uv) {
    float c = texture2D(uTrail, uv).x;
    float s1 = texture2D(uTrail, uv + vec2(uTrailPx, 0.0)).x;
    float s2 = texture2D(uTrail, uv + vec2(0.0, uTrailPx)).x;
    float s3 = texture2D(uTrail, uv + vec2(-uTrailPx, 0.0)).x;
    float s4 = texture2D(uTrail, uv + vec2(0.0, -uTrailPx)).x;
    return step(0.01, c * 0.5 + (s1 + s2 + s3 + s4) * 0.125);
  }

  void main() {
    if (uHasTexture < 0.5) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float aspect = uPlaneAspect;
    bool wide = aspect > 1.0;
    float cellsX = max(wide ? uGridSize : uGridSize * aspect, 1.0);
    float cellsY = max(wide ? uGridSize / aspect : uGridSize, 1.0);
    vec2 cell = vec2((floor(vUv.x * cellsX) + 0.5) / cellsX, (floor(vUv.y * cellsY) + 0.5) / cellsY);
    vec2 disp = clamp(texture2D(uDist, cell).xy, -0.1, 0.1);
    vec2 uv = vUv - disp;

    vec2 offset = vec2((1.0 / aspect) * (uStrength * 0.1), 0.0);
    vec3 base = texture2D(uTexture, coverUv(uv)).rgb;
    float r = texture2D(uTexture, coverUv(uv - offset)).r;
    float b = texture2D(uTexture, coverUv(uv + offset)).b;
    vec3 col = mix(base, vec3(r, base.g, b), trailMask(uv));
    gl_FragColor = vec4(col, 1.0);
  }
`,m=null,p=null,h=null;function x(e,t,r){m||(m=new n.Scene,p=new n.Camera,h=new n.Mesh(new n.PlaneGeometry(2,2)),m.add(h)),h.material=t;let u=e.getRenderTarget();e.setRenderTarget(r),e.render(m,p),e.setRenderTarget(u)}function g(e){let t=()=>new n.WebGLRenderTarget(e,e,{type:n.HalfFloatType,format:n.RGBAFormat,minFilter:n.LinearFilter,magFilter:n.LinearFilter,depthBuffer:!1,stencilBuffer:!1}),r={read:t(),write:t(),swap(){let e=r.read;r.read=r.write,r.write=e}};return r}function S({entry:e,pointerRef:r,onReady:u}){let m=l.useRef(null),p=l.useRef(!1),h=l.useRef(!1),y=l.useRef({x:.5,y:.5,smvx:0,smvy:0,primed:!1}),w=(0,i.useThree)(e=>e.gl),T=(0,i.useThree)(e=>e.size),A=l.useMemo(()=>g(128),[]),b=l.useMemo(()=>g(30),[]),R=l.useMemo(()=>({uTexture:{value:null},uHasTexture:{value:0},uImageAspect:{value:1},uPlaneAspect:{value:1},uTrail:{value:A.read.texture},uDist:{value:b.read.texture},uStrength:{value:.08},uGridSize:{value:30},uTrailPx:{value:.0078125}}),[A,b]),P=l.useMemo(()=>new n.ShaderMaterial({vertexShader:v,fragmentShader:d,uniforms:R,transparent:!0}),[R]),D=l.useMemo(()=>({uPrev:{value:null},uOldCursor:{value:new n.Vector2(.5,.5)},uDelta:{value:new n.Vector2},uNumSteps:{value:1},uAmountPerStep:{value:0},uRadiusSq:{value:o*o},uInfluenceRadiusSq:{value:3*o*(3*o)},uAspect:{value:1},uFadeRate:{value:1},uAgeRate:{value:0},uShrink:{value:.5},uActive:{value:0}}),[]),M=l.useMemo(()=>new n.ShaderMaterial({vertexShader:s,fragmentShader:c,uniforms:D}),[D]),C=l.useMemo(()=>({uPrev:{value:null},uCursor:{value:new n.Vector2(.5,.5)},uVel:{value:new n.Vector2},uMoving:{value:0},uRadiusSq:{value:.1*.1},uRadius2Sq:{value:.04000000000000001},uAspect:{value:1},uDecay:{value:3},uIntensity:{value:3},uDt:{value:.016}}),[]),q=l.useMemo(()=>new n.ShaderMaterial({vertexShader:s,fragmentShader:f,uniforms:C}),[C]);return l.useEffect(()=>{let e=w.getRenderTarget(),t=new n.Color;w.getClearColor(t);let r=w.getClearAlpha();for(let e of(w.setClearColor(0,0),[A.read,A.write,b.read,b.write]))w.setRenderTarget(e),w.clear();w.setRenderTarget(e),w.setClearColor(t,r)},[w,A,b]),l.useEffect(()=>{let t=!1;return fetch(e.src,{mode:"cors"}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.blob()}).then(e=>createImageBitmap(e,{imageOrientation:"flipY"})).then(e=>{if(t)return void e.close();let r=new n.Texture(e);r.flipY=!1,r.colorSpace=n.NoColorSpace,r.minFilter=n.LinearFilter,r.magFilter=n.LinearFilter,r.needsUpdate=!0,R.uTexture.value=r,R.uHasTexture.value=1,R.uImageAspect.value=e.width/Math.max(1,e.height),p.current=!0}).catch(t=>console.error("[ShaderField] texture load failed",e.src,t)),()=>{t=!0}},[e.src,R]),l.useEffect(()=>()=>{R.uTexture.value?.dispose(),P.dispose(),M.dispose(),q.dispose(),A.read.dispose(),A.write.dispose(),b.read.dispose(),b.write.dispose()},[P,M,q,R,A,b]),(0,a.useFrame)((t,a)=>{let i=m.current;if(!i)return;let l=e.getRect();if(!p.current||!l||0===l.width||0===l.height){i.visible=!1;return}let n=w.domElement.getBoundingClientRect();if(l.bottom<n.top-400||l.top>n.bottom+400||l.right<n.left-400||l.left>n.right+400){i.visible=!1;return}i.visible=!0;let s=l.left+l.width/2-n.left,v=l.top+l.height/2-n.top;i.position.x=s-T.width/2,i.position.y=T.height/2-v,i.scale.set(l.width,l.height,1),h.current||(h.current=!0,u());let c=l.width/Math.max(1,l.height);R.uPlaneAspect.value=c;let f=Math.min(a,.016),d=y.current,g=r.current,S=g.valid?(g.x-l.left)/l.width:-10,P=g.valid?1-(g.y-l.top)/l.height:-10;d.primed||(d.x=S,d.y=P,d.smvx=0,d.smvy=0,d.primed=g.valid);let U=S-d.x,E=P-d.y,F=f>0?U/f:0,j=f>0?E/f:0;d.smvx=.85*d.smvx+.15*F,d.smvy=.85*d.smvy+.15*j;let I=Math.hypot(U,E),O=Math.min(20,Math.max(1,Math.ceil(I/Math.max(.005,.5*o))));D.uPrev.value=A.read.texture,D.uOldCursor.value.set(d.x,d.y),D.uDelta.value.set(U,E),D.uNumSteps.value=O,D.uAmountPerStep.value=I/O*50*f,D.uAspect.value=c,D.uFadeRate.value=1-f/.5,D.uAgeRate.value=f/.5,D.uActive.value=+(I>.001),x(w,M,A.write),A.swap(),C.uPrev.value=b.read.texture,C.uCursor.value.set(S,P),C.uVel.value.set(d.smvx,d.smvy),C.uMoving.value=+(Math.abs(F)+Math.abs(j)>.01),C.uAspect.value=c,C.uDt.value=f,x(w,q,b.write),b.swap(),R.uTrail.value=A.read.texture,R.uDist.value=b.read.texture,d.x=S,d.y=P}),(0,t.jsxs)("mesh",{ref:m,visible:!1,children:[(0,t.jsx)("planeGeometry",{args:[1,1]}),(0,t.jsx)("primitive",{object:P,attach:"material"})]})}function y(){let e=(0,i.useThree)(e=>e.camera),t=(0,i.useThree)(e=>e.size);return l.useEffect(()=>{e.left=-t.width/2,e.right=t.width/2,e.top=t.height/2,e.bottom=-t.height/2,e.near=-1e3,e.far=1e3,e.position.set(0,0,1),e.updateProjectionMatrix()},[e,t]),null}e.s(["ShaderCanvas",0,function(e){let a,i,n,o,s,v,c,f,d,m,p,h,x=(0,r.c)(20),{planes:g,onReady:w,position:T,zIndex:A,active:b}=e;x[0]===Symbol.for("react.memo_cache_sentinel")?(a={x:0,y:0,valid:!1},x[0]=a):a=x[0];let R=l.useRef(a);x[1]===Symbol.for("react.memo_cache_sentinel")?(i=()=>{let e=e=>{R.current.x=e.clientX,R.current.y=e.clientY,R.current.valid=!0};return window.addEventListener("pointermove",e,{passive:!0}),()=>window.removeEventListener("pointermove",e)},n=[],x[1]=i,x[2]=n):(i=x[1],n=x[2]),l.useEffect(i,n),x[3]!==T||x[4]!==A?(o={position:T,inset:0,zIndex:A,pointerEvents:"none"},x[3]=T,x[4]=A,x[5]=o):o=x[5];let P=b?"always":"demand";return x[6]===Symbol.for("react.memo_cache_sentinel")?(s={alpha:!0,antialias:!0,powerPreference:"high-performance"},v=[1,2],x[6]=s,x[7]=v):(s=x[6],v=x[7]),x[8]===Symbol.for("react.memo_cache_sentinel")?(f={near:-1e3,far:1e3,position:[0,0,1]},d={position:"absolute",inset:0,pointerEvents:"none"},c=(0,t.jsx)(y,{}),x[8]=c,x[9]=f,x[10]=d):(c=x[8],f=x[9],d=x[10]),x[11]!==w||x[12]!==g?(m=g.map(e=>{let[r,u]=e;return(0,t.jsx)(S,{entry:u,pointerRef:R,onReady:()=>w(r)},r)}),x[11]=w,x[12]=g,x[13]=m):m=x[13],x[14]!==m||x[15]!==P?(p=(0,t.jsxs)(u.Canvas,{orthographic:!0,flat:!0,linear:!0,frameloop:P,gl:s,dpr:v,camera:f,style:d,children:[c,m]}),x[14]=m,x[15]=P,x[16]=p):p=x[16],x[17]!==p||x[18]!==o?(h=(0,t.jsx)("div",{className:"!border-0",style:o,children:p}),x[17]=p,x[18]=o,x[19]=h):h=x[19],h}])},232608,function(e){e.n(e.i(164674))},620284,e=>{"use strict";let t=[];function r(e,t,u=(e,t)=>e===t){if(e===t)return!0;if(!e||!t)return!1;let a=e.length;if(t.length!==a)return!1;for(let r=0;r<a;r++)if(!u(e[r],t[r]))return!1;return!0}function u(e,a=null,i=!1,l={}){for(let u of(null===a&&(a=[e]),t))if(r(a,u.keys,u.equal)){if(i)return;if(Object.prototype.hasOwnProperty.call(u,"error"))throw u.error;if(Object.prototype.hasOwnProperty.call(u,"response"))return l.lifespan&&l.lifespan>0&&(u.timeout&&clearTimeout(u.timeout),u.timeout=setTimeout(u.remove,l.lifespan)),u.response;if(!i)throw u.promise}let n={keys:a,equal:l.equal,remove:()=>{let e=t.indexOf(n);-1!==e&&t.splice(e,1)},promise:("object"==typeof e&&"function"==typeof e.then?e:e(...a)).then(e=>{n.response=e,l.lifespan&&l.lifespan>0&&(n.timeout=setTimeout(n.remove,l.lifespan))}).catch(e=>n.error=e)};if(t.push(n),!i)throw n.promise}e.s(["clear",0,e=>{if(void 0===e||0===e.length)t.splice(0,t.length);else{let u=t.find(t=>r(e,t.keys,t.equal));u&&u.remove()}},"preload",0,(e,t,r)=>void u(e,t,!0,r),"suspend",0,(e,t,r)=>u(e,t,!1,r)])},755838,(e,t,r)=>{"use strict";var u=e.r(271645),a="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},i=u.useState,l=u.useEffect,n=u.useLayoutEffect,o=u.useDebugValue;function s(e){var t=e.getSnapshot;e=e.value;try{var r=t();return!a(e,r)}catch(e){return!0}}var v="u"<typeof window||void 0===window.document||void 0===window.document.createElement?function(e,t){return t()}:function(e,t){var r=t(),u=i({inst:{value:r,getSnapshot:t}}),a=u[0].inst,v=u[1];return n(function(){a.value=r,a.getSnapshot=t,s(a)&&v({inst:a})},[e,r,t]),l(function(){return s(a)&&v({inst:a}),e(function(){s(a)&&v({inst:a})})},[e]),o(r),r};r.useSyncExternalStore=void 0!==u.useSyncExternalStore?u.useSyncExternalStore:v},802239,(e,t,r)=>{"use strict";e.i(247167),t.exports=e.r(755838)},752822,(e,t,r)=>{"use strict";var u=e.r(271645),a=e.r(802239),i="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},l=a.useSyncExternalStore,n=u.useRef,o=u.useEffect,s=u.useMemo,v=u.useDebugValue;r.useSyncExternalStoreWithSelector=function(e,t,r,u,a){var c=n(null);if(null===c.current){var f={hasValue:!1,value:null};c.current=f}else f=c.current;var d=l(e,(c=s(function(){function e(e){if(!o){if(o=!0,l=e,e=u(e),void 0!==a&&f.hasValue){var t=f.value;if(a(t,e))return n=t}return n=e}if(t=n,i(l,e))return t;var r=u(e);return void 0!==a&&a(t,r)?(l=e,t):(l=e,n=r)}var l,n,o=!1,s=void 0===r?null:r;return[function(){return e(t())},null===s?void 0:function(){return e(s())}]},[t,r,u,a]))[0],c[1]);return o(function(){f.hasValue=!0,f.value=d},[d]),v(d),d}},430224,(e,t,r)=>{"use strict";e.i(247167),t.exports=e.r(752822)}]);
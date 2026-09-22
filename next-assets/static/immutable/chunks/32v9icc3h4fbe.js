(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,931110,e=>{"use strict";var t=e.i(843476),a=e.i(724768),o=e.i(174080);e.s(["MuxPlayer",0,function({ref:e,playbackId:l,priority:r,style:n,noControls:c,loop:i,autoPlay:u,poster:d,placeholder:s,aspectRatio:p=16/9,thumbnailTime:m=1,disableCookies:b=!0,disableTracking:f=!0,objectFit:y="cover",objectPosition:v="center",minResolution:k="480p",maxResolution:h="2160p",...g}){if(r){let e=d??s;e&&(0,o.preload)(e,{as:"image",fetchPriority:"high"})}return(0,t.jsx)(a.default,{ref:e,className:"vt-exclude",playbackId:l,disableCookies:b,disableTracking:f,minResolution:k,maxResolution:h,thumbnailTime:m,poster:d??void 0,placeholder:s??void 0,autoPlay:u?"muted":void 0,loading:r?"page":"viewport",loop:i,preload:r?"auto":"metadata",style:{"--media-object-fit":y,"--pip-button":"none","--media-object-position":v,"--loading-indicator":"none","--controls":c?"none":void 0,"--dialog":"none","--controls-backdrop-color":"transparent","--media-background-color":"transparent","--live-button":"none","--seek-backward-button":"none","--seek-forward-button":"none","--airplay-button":"none","--rendition-menu-button":"none","--playback-rate-button":"none","--cast-button":"none",aspectRatio:p,...n},accentColor:"var(--color-theme-accent)",...g})}])},490090,function(e){e.n(e.i(931110))},111839,e=>{e.v(t=>Promise.all(["static/immutable/chunks/2a3mnkfs3ggmq.js","static/immutable/chunks/2me53j0tkxw4i.js"].map(t=>e.l(t))).then(()=>t(101966)))},724768,e=>{"use strict";var t=e.i(271645),a=({condition:e,fallback:a,children:o,...l})=>e?t.default.createElement(t.Suspense,{fallback:a,...l},o):t.default.createElement(t.default.Fragment,null,a),o=t.default.lazy(()=>e.A(111839)),l=e=>{let{style:a,className:o,onIntersection:l,placeholder:r}=e,n=t.default.useRef(null),c=(e=>{let[a,o]=(0,t.useState)(!1);return(0,t.useEffect)(()=>{if("function"==typeof IntersectionObserver){let t=new IntersectionObserver(([e])=>{o(e.isIntersecting)},void 0);return e.current&&t.observe(e.current),()=>{t.disconnect()}}},[e,void 0]),a})(n);return(0,t.useEffect)(()=>{c&&l&&l()},[c,l]),t.default.createElement(t.default.Fragment,null,t.default.createElement("mux-player",{ref:n,"data-mux-player-react-lazy-placeholder":!0,placeholder:null!=r?r:"",style:{"--mux-player-react-lazy-placeholder":r?`url('${r}');`:"",...a},className:o||"",nohotkeys:!0,"aria-hidden":!0,tabIndex:-1},t.default.createElement("div",{"data-mux-player-react-lazy-placeholder-overlay":!0})),t.default.createElement("style",null,`
        mux-player[data-mux-player-react-lazy-placeholder] {
          aspect-ratio: 16/9;
          display: block;
          background-color: var(--media-background-color, #000);
          width: 100%;
          position: relative;
          background-image: var(--mux-player-react-lazy-placeholder);
          background-repeat: no-repeat;
          background-size: var(--media-object-fit, contain);
          background-position: var(--media-object-position, 50% 50%);
          --controls: none;
          --controls-backdrop-color: rgba(0, 0, 0, 0.6);
        }
        mux-player [data-mux-player-react-lazy-placeholder-overlay] {
          position: absolute;
          inset: 0;
          background-color: var(--controls-backdrop-color);
        }
      `))},r="viewport",n=t.default.forwardRef((e,n)=>{let{loading:c=r,...i}=e,u=(()=>{let[e,a]=(0,t.useState)(!1);return(0,t.useEffect)(()=>{"u">typeof window&&a(!0)},[]),e})(),[d,s]=(0,t.useState)(()=>c!==r);return t.default.createElement(a,{condition:u&&d,fallback:t.default.createElement(l,{style:i.style,className:i.className,placeholder:i.placeholder,onIntersection:()=>s(!0)})},t.default.createElement(o,{...i,ref:n}))});e.s(["default",0,n])}]);
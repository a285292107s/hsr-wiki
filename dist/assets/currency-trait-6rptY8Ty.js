import{t as e}from"./rolldown-runtime-DK3Fl9T5.js";import{c as t,q as n,u as r}from"./api-CCcdHWbi.js";import{A as i,a,i as o,n as s}from"./index-D_LQgJtq.js";import{F as c,h as l,l as u,w as d}from"./image-DAIxLDNk.js";import{r as f}from"./format-DRuNi_6B.js";import{n as p,r as m}from"./shared-tjCqi5So.js";import{c as h,l as g}from"./currency-role-1jfcMS4i.js";var _=e({currencyTraitPage:()=>M}),v=i,y=[`faction`,`combat`,`special`],b={Silver:`silver`,Gold:`gold`,Multicolor:`multicolor`,Unique:`unique`};function x(e){let t=o(e);return t?v(t):e}function S(e){return e?b[e]??`base`:`base`}function C(e){if(!e)return v(`catalog.qualityBase`);let t=a(e);return t?v(t):e}function w(e){return String(e||``).replace(/\\n/g,` `).replace(/\s+/g,` `).trim()}function T(e,t=0){let r=d(e.icon),i=w(e.simple_desc);return`<a class="nk-cw-trait-card" href="${c(n(`/currency/trait/${e.id}`))}" data-id="${c(e.id)}" title="${c(e.name)}：${c(i)}" style="--i:${t}">
      <span class="nk-cw-trait-card__icon">${u(r,{loading:`lazy`})}</span>
      <span class="nk-cw-trait-card__body">
        <span class="nk-cw-trait-card__name">${c(e.name)}</span>
      </span>
    </a>`}function E(e){let t=[...e.member_props.map(e=>({prop:e,scope:v(`ctrait.scope.member`)})),...e.all_props.map(e=>({prop:e,scope:v(`cwRole.scopeAll`)}))];return t.length?`<div class="nk-cwtp__props">${t.map(({prop:e,scope:t})=>`<span class="nk-cwtp__prop"><i>${c(t)}</i><span>${c(h(e))}</span><b>+${c(g(e.value))}</b></span>`).join(``)}</div>`:``}function D(e){let t=e.desc?f(e.desc,e.params):``,n=e.buff_desc?f(e.buff_desc,e.buff_params||[]):``,r=t?``:E(e);return`${t?`<div class="nk-cwtp__tier-desc">${t}</div>`:``}${n?`<div class="nk-cwtp__tier-buff">${n}</div>`:``}${r}`}function O(e,t=`people`){let n=v(t===`level`?`ctrait.levelActivation`:`catalog.activation`,{n:e.layer});return`<li class="nk-cwtp__tier" data-quality="${S(e.quality)}">
      <span class="nk-cwtp__tier-node"><b>${e.layer}</b></span>
      <div class="nk-cwtp__tier-body">
        <div class="nk-cwtp__tier-head">
          <span class="nk-cwtp__tier-quality">${c(C(e.quality))}</span>
          <span class="nk-cwtp__tier-act">${c(n)}</span>
          <span class="nk-cwtp__tier-rule"></span>
        </div>
        ${D(e)}
      </div>
    </li>`}function k(e){return e.length?`<div class="nk-cwtp__members">${e.map(e=>{let t=s(String(e.rarity)),r=t?v(t):``;return`<a class="nk-cwtp__member" href="${c(n(`/currency/role/${e.id}`))}" title="${c(e.name)}">
        <span class="nk-cwtp__member-avatar">${u(l(e.avatar_id||e.id),{loading:`lazy`})}</span>
        ${r?`<span class="nk-cwtp__member-cost">${c(r)}</span>`:``}
        <span class="nk-cwtp__member-name">${c(e.name)}</span>
      </a>`}).join(``)}</div>`:``}function A(e){let t=`nk-cwtp-rule`;return`<div class="nk-cwtp__rules">${e.map((e,n)=>`<input class="nk-cwtp__rule-radio" type="radio" name="${t}" id="${t}-${n}"${n===0?` checked`:``}>`).join(``)}<div class="nk-cwtp__rule-tabs">${e.map((e,n)=>`<label class="nk-cwtp__rule-tab" for="${t}-${n}">${c(e.name)}</label>`).join(``)}</div>${e.map(e=>{let t=f(e.rule_desc,e.rule_params),n=e.layers.map(e=>O(e)).join(``);return`<section class="nk-cwtp__rule-panel" data-rule="${c(e.id)}">
        ${t?`<p class="nk-cwtp__rule-desc">${t}</p>`:``}
        <ol class="nk-cwtp__tiers nk-cwtp__tiers--rule">${n}</ol>
      </section>`}).join(``)}</div>`}function j(e){let t=e.cat||`special`,r=e.special||null,i=e.layers||[],a=e.remarks||[],o=e.members||[],s=String(e.id),l=c(n(`/currency/trait/${s}`)),p=d(e.icon),m=(r?r.thresholds:i).map(e=>`<span class="nk-cwtp__threshold" data-quality="${S(e.quality)}">${e.layer}</span>`).join(`<span class="nk-cwtp__threshold-sep">/</span>`),h=f(e.desc,e.base_params),g=f(e.simple_desc||e.desc,e.base_params),_=a.map(e=>`<p class="nk-cwtp__note nk-cwtp__full">${f(e.desc,e.params)}</p>`).join(``),y=a.map(e=>`<p class="nk-cwtp__note nk-cwtp__simple">${f(e.simple_desc,e.params)}</p>`).join(``);return`<article class="nk-cwtp" data-cat="${t}">
      <input id="nk-cwtp-mode" class="nk-cwtp__mode" type="checkbox">
      <header class="nk-cwtp__head">
        <span class="nk-cwtp__sigil">${u(p,{fetchpriority:`high`})}</span>
        <div class="nk-cwtp__ident">
          <div class="nk-cwtp__eyebrow">
            <span class="nk-cwtp__cat" data-cat="${t}">${c(x(t))}</span>
            <span class="nk-cwtp__rubric">№ ${c(s)}</span>
          </div>
          <h2 class="nk-cwtp__name"><a href="${l}" title="${c(v(`card.viewDetail`,{name:e.name}))}">${c(e.name)}<span class="nk-cwtp__name-arrow" aria-hidden="true">↗</span></a></h2>
          ${m?`<div class="nk-cwtp__thresholds" aria-hidden="true">${m}</div>`:``}
        </div>
        <label class="nk-cwtp__switch" for="nk-cwtp-mode" title="${c(v(`cwRole.simple`))}">
          <span class="nk-cwtp__switch-text">${c(v(`cwRole.simple`))}</span>
          <span class="nk-cwtp__switch-track"><span class="nk-cwtp__switch-knob"></span></span>
        </label>
      </header>
      <div class="nk-cwtp__body">
        <section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${c(v(`ctrait.sec.effect`))}</h3>
          <div class="nk-cwtp__effect nk-cwtp__full">${h}</div>
          <div class="nk-cwtp__effect nk-cwtp__simple">${g}</div>
          ${_||y?`<div class="nk-cwtp__notes">${_}${y}</div>`:``}
        </section>

        ${r&&r.kind===`rules`?`<section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${c(v(`ctrait.sec.rules`))}</h3>
          ${A(r.rules||[])}
        </section>`:i.length?`<section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${c(v(`ctrait.sec.layers`))}</h3>
          <ol class="nk-cwtp__tiers">${i.map(e=>O(e,r&&r.kind===`astropolis`?`level`:`people`)).join(``)}</ol>
        </section>`:``}

        ${o.length?`<section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${c(v(`ctrait.sec.members`))}<span class="nk-cwtp__sec-note">${c(v(`ctrait.memberCount`,{n:o.length}))}</span></h3>
          ${k(o)}
        </section>`:``}
      </div>
    </article>`}var M={id:`currency-trait`,titleKey:`catalog.titleWithMode`,titleArgs:{mode:`catalog.currencyWar`,name:`nav.cwTrait`},headless:!0,searchKey:`catalog.cwTrait.search`,gridClass:`nk-cw-trait-grid`,skeleton:{variant:`row`},styles:[p,m],async fetchData(e){let[{traits:i,season:a},{roles:o}]=await Promise.all([r(),t()]),s=e?.cwSeason??a?.id??null,c=s==null?i:i.filter(e=>e.season_id===s),l=new Map;for(let e of o)for(let t of e.trait_list){let n=l.get(t),r={id:e.id,name:e.name,avatar_id:e.avatar_id,rarity:e.rarity};n?n.push(r):l.set(t,[r])}return c.map(e=>({id:String(e.id),name:e.name,href:n(`/currency/trait/${e.id}`),icon:e.icon,mini_icon:e.mini_icon,cat:e.cat,desc:e.desc,simple_desc:e.simple_desc,base_params:e.base_params,activation_type:e.activation_type,season_id:e.season_id,layers:e.layers,special:e.special??null,remarks:e.remarks,package:e.package,members:l.get(e.id)??[]}))},buildFilters(e){let t=new Set(e.map(e=>e.cat).filter(Boolean)),n=y.filter(e=>t.has(e)),r=[];return n.length&&r.push({key:`cat`,labelKey:`catalog.filter.category`,options:n.map(e=>({val:e,labelKey:o(e)}))}),r},split:{tabFilterKey:`cat`,tabGroupLabelKey:`nav.cwTrait`,railLabelKey:`nav.cwTrait`,renderDetail:e=>j(e)},renderCard:(e,t)=>T(e,t)};export{_ as n,M as t};
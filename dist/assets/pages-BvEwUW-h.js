import{t as e}from"./rolldown-runtime-DK3Fl9T5.js";import{H as t,I as n,J as r,K as i,M as a,O as o,T as s,a as c,i as l,k as u,r as d}from"./api-L-fkHD5S.js";import{P as f,S as p,T as m,c as h,n as g,o as _}from"./index-CxolnmEX.js";import{E as v,M as y,_ as b,b as x,h as S,j as C,k as w,l as T,v as E}from"./image-W44ra8-P.js";import{r as D}from"./format-BpcomHVj.js";import{n as O,t as k}from"./shared-CxhOtvMF.js";import{n as ee}from"./monster-family-BJhAoM7l.js";import{r as A}from"./endgame-KyDIPRU4.js";import{t as j}from"./currency-role-B435kqIT.js";import{c as M,l as N}from"./currency-role-vuvBcLuO.js";import{t as P}from"./currency-trait-BVMBl2pn.js";var F={id:`character`,titleKey:`catalog.character.title`,subtitle:`CHARACTER INDEX`,searchKey:`catalog.character.search`,gridClass:`nk-idx-grid`,async fetchData(){let e=await s(),t=o(),n=[];for(let i of e){if(!i.name||u(i.id)&&a(i.id)!==t)continue;let e=i.element.toLowerCase(),o=i.path.toLowerCase(),s=String(i.id);n.push({id:s,name:i.name,href:r(`/character/${s}`),avatar:S(s),elemImg:b(e),pathImg:y(o),element:e,path:o,rarity:i.rarity})}return n.sort((e,t)=>{let n=Number(e.id)>=8e3;return n===Number(t.id)>=8e3?Number(t.id)-Number(e.id):n?1:-1}),n},buildFilters(e){let t={},n={};e.forEach(e=>{e.path&&e.pathImg&&(t[String(e.path)]=String(e.pathImg)),e.element&&e.elemImg&&(n[String(e.element)]=String(e.elemImg))});let r=[...new Set(e.map(e=>String(e.path||``)).filter(Boolean))],i=[...new Set(e.map(e=>String(e.element||``)).filter(Boolean))];return[{key:`path`,labelKey:`catalog.filter.path`,options:[{val:``,labelKey:`catalog.all`},...r.map(e=>({val:e,label:h(e),icon:t[e]}))]},{key:`element`,labelKey:`catalog.filter.element`,options:[{val:``,labelKey:`catalog.all`},...i.map(e=>({val:e,label:_(e),icon:n[e]}))]},{key:`rarity`,labelKey:`catalog.filter.rarity`,options:[{val:``,labelKey:`catalog.all`},{val:`5`,label:k+`5`},{val:`4`,label:k+`4`}]}]},renderCard(e,t){let n=`★`.repeat(Number(e.rarity)||5),r=String(e.element||``),i=String(e.path||``),a=T(String(e.avatar||``),{alt:e.name,loading:`lazy`});return`<a class="nk-idx-card" href="${p(e.href)}" data-rarity="${p(e.rarity)}" title="${p(e.name)}" style="--i:${t}">
    <span class="nk-idx-card__portrait">
      ${a}
    </span>
    <span class="nk-idx-card__body">
      <span class="nk-idx-card__name-row">
        <span class="nk-idx-card__name">${p(e.name)}</span>
      </span>
      <span class="nk-idx-card__stars-row" aria-hidden="true">${n}</span>
      <span class="nk-idx-card__meta">
        <span class="nk-idx-card__tag">
          ${e.elemImg?T(String(e.elemImg),{className:`nk-idx-card__icon`}):``}
          <span class="nk-idx-card__tag-text">${p(_(r))}</span>
        </span>
        <span class="nk-idx-card__tag">
          ${e.pathImg?T(String(e.pathImg),{className:`nk-idx-card__icon`}):``}
          <span class="nk-idx-card__tag-text">${p(h(i))}</span>
        </span>
      </span>
    </span>
  </a>`}},I={id:`lightcone`,titleKey:`catalog.lightcone.title`,subtitle:`LIGHT CONES`,searchKey:`catalog.lightcone.search`,gridClass:`nk-cat-grid nk-lc-grid`,async fetchData(){let e=await t(),n=[];for(let t of e){if(!t.name)continue;let e=(t.path||``).toLowerCase();n.push({id:String(t.id),name:t.name,href:r(`/lightcone/${t.id}`),img:w(String(t.id)),pathImg:y(e),path:e,rarity:t.rarity,skillName:t.skill_name})}return n.sort((e,t)=>{let n=Number(e.id),r=Number(t.id),i=+(n>=24e3),a=+(r>=24e3);return i===a?r-n:i-a}),n},buildFilters(e){let t={};e.forEach(e=>{e.path&&e.pathImg&&(t[String(e.path)]=String(e.pathImg))});let n=[...new Set(e.map(e=>String(e.path||``)).filter(Boolean))];return[{key:`rarity`,labelKey:`catalog.filter.rarity`,options:[{val:``,labelKey:`catalog.all`},{val:`5`,label:k+`5`},{val:`4`,label:k+`4`},{val:`3`,label:k+`3`}]},{key:`path`,labelKey:`catalog.filter.path`,options:[{val:``,labelKey:`catalog.all`},...n.map(e=>({val:e,label:h(e),icon:t[e]}))]}]},renderCard(e,t){let n=`★`.repeat(Number(e.rarity)||5),r=String(e.path||``),i=String(e.skillName||``);return`<a class="nk-lc-card" href="${p(e.href)}" data-rarity="${p(e.rarity)}" data-name="${p(e.name)}" data-path="${p(r)}" title="${p(e.name)}" style="--i:${t}">
      <div class="nk-lc-card__img">
        ${T(String(e.img||``),{className:`lc-avatar`,alt:e.name,loading:`lazy`})}
        <div class="nk-sk nk-sk--shimmer nk-lc-card__shimmer" aria-hidden="true"></div>
        ${e.pathImg?`<div class="nk-lc-card__badge">${T(String(e.pathImg),{alt:h(r)})}</div>`:``}
        <div class="nk-lc-card__info">
          <span class="nk-lc-card__name">${p(e.name)}</span>
          <span class="nk-lc-card__stars-row" aria-hidden="true">${n}</span>
          ${i?`<span class="nk-lc-card__skill" title="${p(i)}">${p(i)}</span>`:``}
        </div>
      </div>
    </a>`}},L=f,R={id:`relic`,titleKey:`catalog.relic.title`,subtitle:`RELICS`,searchKey:`catalog.relic.search`,gridClass:`nk-cat-grid nk-relic-grid`,async fetchData(){let e=await n(),t=[];for(let n of e){if(!n.name)continue;let e=(Array.isArray(n.require_num)?n.require_num:[]).includes(4)?`4`:`2`;t.push({id:String(n.id),name:n.name,href:r(`/relic/${n.id}`),img:v(n.icon),set_type:e,set_tag:L(`relic.setPieces`,{n:e===`4`?4:2})})}return t.sort((e,t)=>Number(t.id)-Number(e.id)),t},filters:[{key:`set_type`,labelKey:`catalog.filter.setType`,options:[{val:``,labelKey:`catalog.all`},{val:`4`,labelKey:`catalog.option.set4Cavern`},{val:`2`,labelKey:`catalog.option.set2Planar`}]}],renderCard(e,t){let n=typeof e.set_tag==`string`?e.set_tag:``;return`<a class="nk-relic-card" href="${p(e.href)}" data-name="${p(e.name)}" data-set="${p(String(e.set_type))}" title="${p(e.name)}" style="--i:${t}">
      <div class="nk-relic-card__plate">
        ${T(String(e.img||``),{className:`nk-relic-card__img`,alt:e.name,loading:`lazy`})}
        ${n?`<span class="nk-relic-card__tag">${p(n)}</span>`:``}
      </div>
      <div class="nk-relic-card__info">
        <span class="nk-relic-card__name">${p(e.name)}</span>
      </div>
    </a>`}},z=f,B={BOSS:`monster.rank.boss`,ELITE:`monster.rank.elite`,MINION:`monster.rank.minion`},V=e=>B[e]?m(B[e]):e,H=[`Physical`,`Fire`,`Ice`,`Thunder`,`Wind`,`Quantum`,`Imaginary`],U={id:`monster`,titleKey:`catalog.monster.title`,subtitle:`HOSTILE SPECIES`,searchKey:`catalog.monster.search`,gridClass:`nk-cat-grid nk-mob-grid`,virtualImgRatio:5/4,virtualMinColW:130,virtualInfoH:70,virtualMobileRowH:82,async fetchData(){let e=(await i()).filter(e=>e.name),t=new Map;for(let n of ee(e).values())n.forEach((e,r)=>t.set(String(e.id),{index:r+1,count:n.length}));let n=[];for(let i of e){let e=i.type||``,a=i.weak||[],o=i.camp||``,s=a.map(e=>_(e)),c=t.get(String(i.id)),l=c?.count??1;n.push({id:String(i.id),name:i.name,href:r(`/monster/${i.id}`),img:C(i.icon),type:e,typeLabel:V(e),weak:a,weakNames:s,camp:o,variantIndex:c?.index??1,variantCount:l,searchText:[...s,o].filter(Boolean).join(` `)})}return n},buildFilters(e){let t=[...new Set(e.map(e=>String(e.type||``)).filter(Boolean))],n=[...new Set(e.map(e=>String(e.camp||``)).filter(Boolean))].sort((e,t)=>e.localeCompare(t,`zh-Hans-CN`));return[{key:`type`,labelKey:`catalog.filter.category`,options:[{val:``,labelKey:`catalog.all`},...t.map(e=>({val:e,label:V(e)}))]},{key:`weak`,labelKey:`catalog.filter.weak`,options:[{val:``,labelKey:`catalog.all`},...H.map(e=>({val:e,label:_(e),icon:b(e)}))]},{key:`camp`,labelKey:`catalog.filter.camp`,options:[{val:``,labelKey:`catalog.all`},...n.map(e=>({val:e,label:e}))]}]},renderCard(e,t){let n=String(e.type||``),r=String(e.typeLabel||``),i=e.weakNames??[],a=e.weak??[],o=String(e.camp||``),s=Number(e.variantCount)||1,c=Number(e.variantIndex)||1,l=s>1?z(`mob.badge.variant`,{i:c,n:s}):``,u=a.length?a.map((e,t)=>T(b(e),{alt:i[t]||e,loading:`lazy`})).join(``):`<span class="nk-mob-card__none">${p(z(`mob.noWeak`))}</span>`,d=[e.name,i.length?z(`mob.card.weak`,{list:i.join(`/`)}):z(`mob.noWeak`),r,o,l].filter(Boolean).join(` · `);return`<a class="nk-mob-card" data-type="${p(n)}" href="${p(e.href)}" data-name="${p(e.name)}" title="${p(d)}" style="--i:${t}">
      <span class="nk-mob-card__fig">
        ${T(String(e.img||``),{alt:e.name,loading:`lazy`})}
      </span>
      <span class="nk-mob-card__info">
        <span class="nk-mob-card__name">${p(e.name)}</span>
        <span class="nk-mob-card__weak">${u}${o?`<span class="nk-mob-card__camp">${p(o)}</span>`:``}</span>
        <span class="nk-mob-card__meta">
          <span class="nk-mob-card__type">${p(r||z(`common.unknown`))}</span>
          ${l?`<span class="nk-mob-card__var">${p(l)}</span>`:``}
        </span>
      </span>
    </a>`}},W={Basic:`var(--cw-rarity-3)`,Craftable:`var(--cw-rarity-4)`,Radiant:`var(--gold-400)`,Emblem:`var(--prop-hp)`,FateEquip:`var(--prop-hp)`,Hack:`var(--skill-passive)`,Crown:`var(--gold-300)`,Material:`var(--cw-rarity-1)`,TraitSpecial:`var(--cw-faction-core)`},G={ExtraSpeedAddedRatio1:`var(--prop-hp)`,ExtraSpeedAddedRatio2:`var(--prop-hp)`,ExtraFrontPowerAddedRatio1:`var(--cw-special-core)`,ExtraBackPowerAddedRatio1:`var(--cw-combat-core)`,ExtraHPAddedRatio1:`var(--cw-rarity-2)`,ExtraHPAddedRatio2:`var(--cw-rarity-2)`,ExtraAllDamageTypeAddedRatio1:`var(--gold-400)`,ExtraAllDamageTypeAddedRatio4:`var(--gold-400)`,ExtraAllDamageTypeAddedRatio5:`var(--gold-400)`,ExtraCriticalChanceBase:`var(--diff-del)`,ExtraCriticalDamageBase:`var(--diff-del)`,ExtraBreakDamageAddedRatio:`var(--cw-faction-core)`,BreakDamageAddedRatioBase:`var(--cw-faction-core)`,StanceBreakAddedRatio:`var(--cw-faction-core)`,ExtraHealRatioBase:`var(--cw-rarity-2)`,ExtraHealAddedRatio:`var(--cw-rarity-2)`,ExtraShieldRatioBase:`var(--cw-rarity-3)`,ExtraShieldAddedRatio:`var(--cw-rarity-3)`,ExtraAllDamageReduce:`var(--cw-rarity-3)`,ExtraInitSP:`var(--gold-300)`,ExtraLuckChance:`var(--ctrait-multicolor)`,ExtraLuckDamage:`var(--ctrait-multicolor)`};function K(e){return G[e]||`var(--primary)`}function q(e,t=0){let n=E(e.icon),r=(e.tags||[]).map(e=>`<span class="nk-cw-tag">${p(e.desc)}</span>`).join(``),i=e.category_name||``,a=W[e.category||``]||`var(--border2)`,o=e.props||[],s=o.length?`<div class="nk-cw-equip-stats">${o.map(e=>{let t=K(e.property_type||e.name),n=M(e);return`<div class="nk-cw-equip-stat">
          <span class="nk-cw-equip-stat__dot" style="background:${t}"></span>
          <span class="nk-cw-equip-stat__name" title="${p(n)}">${p(n)}</span>
          <span class="nk-cw-equip-stat__val">${N(e.value)}</span>
        </div>`}).join(``)}</div>`:``,c=o.length?``:(e.desc||``).split(`\\n`)[0],l=c?`<div class="nk-cw-equip-desc">${p(c)}</div>`:``;return`<div class="nk-cw-card nk-cw-equip-card" style="--i:${t}" title="${p(e.name)}">
      <div class="nk-cw-equip-header">
        <div class="nk-cw-equip-icon" style="border-color:${a}">${T(n,{alt:e.name,loading:`lazy`})}</div>
        <div class="nk-cw-equip-title">
          <div class="nk-cw-equip-name">${p(e.name)}</div>
          ${i?`<div class="nk-cw-equip-cat">${p(i)}</div>`:``}
        </div>
      </div>
      ${r?`<div class="nk-cw-equip-tags">${r}</div>`:``}
      ${s}
      ${l}
    </div>`}var J={id:`currency-equipment`,titleKey:`catalog.titleWithMode`,titleArgs:{mode:`catalog.currencyWar`,name:`nav.cwEquipment`},subtitle:`EQUIPMENT`,searchKey:`catalog.cwEquipment.search`,gridClass:`nk-cat-grid nk-cw-grid nk-cw-grid--wide`,skeleton:{variant:`row`},styles:[O],async fetchData(e){let{items:t,season:n}=await l(),r=e?.cwSeason??n?.id??null;return(r==null?t:t.filter(e=>(e.season_ids??[]).includes(r))).map(e=>({id:String(e.id),name:e.name,icon:e.icon,desc:e.desc,category:e.category,category_name:e.category_name,tags:e.tags,tag:(e.tags||[]).map(e=>String(e.id)),props:e.props,priority:e.priority,cost:e.priority>=6?`6+`:String(e.priority),recommend_roles:e.recommend_roles}))},buildFilters(e){let t=[],n=[`1`,`2`,`3`,`4`,`5`,`6+`],r=new Set(e.map(e=>e.cost)),i=n.filter(e=>r.has(e));i.length>1&&t.push({key:`cost`,labelKey:`catalog.filter.cost`,options:[{val:``,labelKey:`catalog.all`},...i.map(e=>g(e)?{val:e,labelKey:g(e)}:{val:e,label:e})]});let a=new Map;e.forEach(e=>{let t=e.category,n=e.category_name;t&&n&&!a.has(t)&&a.set(t,n)}),a.size&&t.push({key:`category`,labelKey:`catalog.filter.category`,options:[{val:``,labelKey:`catalog.all`},...[...a.entries()].map(([e,t])=>({val:e,label:t}))]});let o=new Map;return e.forEach(e=>{(e.tags||[]).forEach(e=>{o.has(e.id)||o.set(e.id,e.desc)})}),o.size&&t.push({key:`tag`,labelKey:`catalog.filter.tag`,options:[{val:``,labelKey:`catalog.all`},...[...o.entries()].sort((e,t)=>e[0]-t[0]).map(([e,t])=>({val:String(e),label:t}))]}),t},renderCard:(e,t)=>q(e,t)};function Y(e,t=0){let n=x(e.icon),r=D(e.desc,e.params);return`<div class="nk-cw-card nk-cw-portal-card" style="--i:${t}" title="${p(e.name)}">
      <div class="nk-cw-card__icon">${T(n,{alt:e.name,loading:`lazy`})}</div>
      <div class="nk-cw-card__body">
        <div class="nk-cw-card__name">${p(e.name)}</div>
        <div class="nk-cw-card__desc">${r}</div>
      </div>
    </div>`}var X={id:`currency-portal`,titleKey:`catalog.titleWithMode`,titleArgs:{mode:`catalog.currencyWar`,name:`nav.cwPortal`},subtitle:`PORTALS`,searchKey:`catalog.cwPortal.search`,gridClass:`nk-cat-grid nk-cw-grid nk-cw-grid--wide`,skeleton:{variant:`row`},styles:[O],async fetchData(e){let{portals:t,season:n}=await c(),r=e?.cwSeason??n?.id??null;return t.filter(e=>e.in_book).filter(e=>r==null||e.season_id===r).map(e=>({id:String(e.id),name:e.title,icon:e.icon,desc:e.desc,params:e.params}))},renderCard:(e,t)=>Y(e,t)},Z={Silver:`catalog.quality.silver`,Gold:`catalog.quality.gold`,Prismatic:`catalog.quality.prismatic`},Q=[`Silver`,`Gold`,`Prismatic`];function te(e,t=0){let n=x(e.icon)||x(e.mini_icon),r=e.quality||``,i=Z[r]?f(Z[r]):r,a=D(e.desc,e.params);return`<div class="nk-cw-card nk-cw-augment-card" data-quality="${p(r)}" style="--i:${t}" title="${p(e.name)}">
      <div class="nk-cw-card__icon">${T(n,{alt:e.name,loading:`lazy`})}</div>
      <div class="nk-cw-card__body">
        <div class="nk-cw-card__name">${p(e.name)}</div>
        ${i?`<span class="nk-cw-tag nk-cw-tag--${r.toLowerCase()}">${p(i)}</span>`:``}
        <div class="nk-cw-card__desc">${a}</div>
      </div>
    </div>`}var ne={id:`currency-augment`,titleKey:`catalog.titleWithMode`,titleArgs:{mode:`catalog.currencyWar`,name:`nav.cwAugment`},subtitle:`AUGMENTS`,searchKey:`catalog.cwAugment.search`,gridClass:`nk-cat-grid nk-cw-grid nk-cw-grid--wide`,skeleton:{variant:`row`},styles:[O],async fetchData(e){let{augments:t,season:n}=await d(),r=e?.cwSeason??n?.id??null;return(r==null?t:t.filter(e=>e.season_id===r)).map(e=>({id:String(e.id),name:e.name,icon:e.icon,mini_icon:e.mini_icon,quality:e.quality,category_id:e.category_id,desc:e.desc,params:e.params,chapter_limit:e.chapter_limit}))},buildFilters(e){let t=[],n=[...new Set(e.map(e=>e.quality).filter(Boolean))].sort((e,t)=>Q.indexOf(e)-Q.indexOf(t));return n.length&&t.push({key:`quality`,labelKey:`catalog.filter.quality`,options:[{val:``,labelKey:`catalog.all`},...n.map(e=>Z[e]?{val:e,labelKey:Z[e]}:{val:e,label:e})]}),t},renderCard:(e,t)=>te(e,t)},re=e({CATALOG_PAGES:()=>$}),$={character:F,lightcone:I,relic:R,monster:U,endgame:A,"currency-role":j,"currency-equipment":J,"currency-portal":X,"currency-augment":ne,"currency-trait":P};export{re as n,$ as t};
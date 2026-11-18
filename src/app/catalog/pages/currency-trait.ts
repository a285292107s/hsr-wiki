import { escHtml, fmtDesc, gridFightTraitIconUrl, avatarShopIconUrl } from '../../../lib/format';
import { propLabel, propValue } from '../../../lib/currency-role';
import { activeHref } from '../../../lib/i18n/active';
import { loadLocalCurrencyTraits, loadLocalCurrencyRoles } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';
import { loadCwCatalogCss, loadCwTraitBrowserCss } from './shared';
import { cwTraitCatKey, cwTraitQualityKey, cwCostKey } from '../../../lib/enum-labels';
import { translate } from '../../i18n';

const t = translate;

type TraitCat = 'faction' | 'combat' | 'special';

interface TraitLayer {
  layer: number;
  quality: string | null;
  desc: string;
  params: number[];
  member_props: Array<{ property_type?: string; prop_name?: string; name?: string; value: number }>;
  all_props: Array<{ property_type?: string; prop_name?: string; name?: string; value: number }>;
  buff_desc?: string;
  buff_params?: number[];
  simple_desc?: string;
}

interface TraitRule {
  id: string;
  name: string;
  rule_desc: string;
  rule_params: number[];
  rule_simple_desc: string;
  layers: TraitLayer[];
}

interface TraitSpecial {
  kind: 'rules' | 'astropolis';
  thresholds: TraitLayer[];
  rules?: TraitRule[];
}

interface TraitRemark {
  desc: string;
  simple_desc: string;
  params: number[];
}

interface TraitMember {
  id: number;
  name: string;
  avatar_id: number;
  rarity: number;
}

const CAT_ORDER: TraitCat[] = ['faction', 'combat', 'special'];

const QUALITY_CLASS: Record<string, string> = {
  Silver: 'silver',
  Gold: 'gold',
  Multicolor: 'multicolor',
  Unique: 'unique',
};

function catLabel(cat: TraitCat): string {
  const key = cwTraitCatKey(cat);
  return key ? t(key) : cat;
}

function qualityClass(quality: string | null): string {
  return quality ? QUALITY_CLASS[quality] ?? 'base' : 'base';
}

function qualityLabel(quality: string | null): string {
  if (!quality) return t('catalog.qualityBase');
  const key = cwTraitQualityKey(quality);
  return key ? t(key) : quality;
}

function plainDesc(raw: unknown): string {
  return String(raw || '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function renderTraitCard(item: CatalogItem, index = 0): string {
  const icon = gridFightTraitIconUrl(item.icon as string);
  const fullDesc = plainDesc(item.simple_desc);

  return `<a class="nk-cw-trait-card" href="${escHtml(activeHref(`/currency/trait/${item.id}`))}" data-id="${escHtml(item.id)}" title="${escHtml(item.name)}：${escHtml(fullDesc)}" style="--i:${index}">
      <span class="nk-cw-trait-card__icon"><img loading="lazy" data-cdn-src="${escHtml(icon)}" alt=""></span>
      <span class="nk-cw-trait-card__body">
        <span class="nk-cw-trait-card__name">${escHtml(item.name)}</span>
      </span>
    </a>`;
}

function renderProps(layer: TraitLayer): string {
  const rows = [
    ...layer.member_props.map((prop) => ({ prop, scope: t('ctrait.scope.member') })),
    ...layer.all_props.map((prop) => ({ prop, scope: t('cwRole.scopeAll') })),
  ];
  if (!rows.length) return '';
  return `<div class="nk-cwtp__props">${rows.map(({ prop, scope }) => `<span class="nk-cwtp__prop"><i>${escHtml(scope)}</i><span>${escHtml(propLabel(prop))}</span><b>+${escHtml(propValue(prop.value))}</b></span>`).join('')}</div>`;
}

function tierBody(layer: TraitLayer): string {
  const desc = layer.desc ? fmtDesc(layer.desc, layer.params) : '';
  const buff = layer.buff_desc ? fmtDesc(layer.buff_desc, layer.buff_params || []) : '';
  const props = desc ? '' : renderProps(layer);
  return `${desc ? `<div class="nk-cwtp__tier-desc">${desc}</div>` : ''}${buff ? `<div class="nk-cwtp__tier-buff">${buff}</div>` : ''}${props}`;
}

function renderTier(layer: TraitLayer, mode: 'people' | 'level' = 'people'): string {
  const act = mode === 'level' ? t('ctrait.levelActivation', { n: layer.layer }) : t('catalog.activation', { n: layer.layer });
  return `<li class="nk-cwtp__tier" data-quality="${qualityClass(layer.quality)}">
      <span class="nk-cwtp__tier-node"><b>${layer.layer}</b></span>
      <div class="nk-cwtp__tier-body">
        <div class="nk-cwtp__tier-head">
          <span class="nk-cwtp__tier-quality">${escHtml(qualityLabel(layer.quality))}</span>
          <span class="nk-cwtp__tier-act">${escHtml(act)}</span>
          <span class="nk-cwtp__tier-rule"></span>
        </div>
        ${tierBody(layer)}
      </div>
    </li>`;
}

function renderMembers(members: TraitMember[]): string {
  if (!members.length) return '';
  return `<div class="nk-cwtp__members">${members.map((member) => {
    const costKey = cwCostKey(String(member.rarity));
    const cost = costKey ? t(costKey) : '';
    return `<a class="nk-cwtp__member" href="${escHtml(activeHref(`/currency/role/${member.id}`))}" title="${escHtml(member.name)}">
        <span class="nk-cwtp__member-avatar"><img loading="lazy" data-cdn-src="${escHtml(avatarShopIconUrl(member.avatar_id || member.id))}" alt=""></span>
        ${cost ? `<span class="nk-cwtp__member-cost">${escHtml(cost)}</span>` : ''}
        <span class="nk-cwtp__member-name">${escHtml(member.name)}</span>
      </a>`;
  }).join('')}</div>`;
}

function renderRules(rules: TraitRule[]): string {
  const group = 'nk-cwtp-rule';
  const radios = rules
    .map((_, i) => `<input class="nk-cwtp__rule-radio" type="radio" name="${group}" id="${group}-${i}"${i === 0 ? ' checked' : ''}>`)
    .join('');
  const tabs = rules
    .map((rule, i) => `<label class="nk-cwtp__rule-tab" for="${group}-${i}">${escHtml(rule.name)}</label>`)
    .join('');
  const panels = rules
    .map((rule) => {
      const ruleDesc = fmtDesc(rule.rule_desc, rule.rule_params);
      const tiers = rule.layers.map((layer) => renderTier(layer)).join('');
      return `<section class="nk-cwtp__rule-panel" data-rule="${escHtml(rule.id)}">
        ${ruleDesc ? `<p class="nk-cwtp__rule-desc">${ruleDesc}</p>` : ''}
        <ol class="nk-cwtp__tiers nk-cwtp__tiers--rule">${tiers}</ol>
      </section>`;
    })
    .join('');
  return `<div class="nk-cwtp__rules">${radios}<div class="nk-cwtp__rule-tabs">${tabs}</div>${panels}</div>`;
}

function renderTraitDetail(item: CatalogItem): string {
  const cat = (item.cat as TraitCat) || 'special';
  const special = (item.special as TraitSpecial | null) || null;
  const layers = (item.layers as TraitLayer[]) || [];
  const remarks = (item.remarks as TraitRemark[]) || [];
  const members = (item.members as TraitMember[]) || [];
  const id = String(item.id);
  const detailHref = escHtml(activeHref(`/currency/trait/${id}`));
  const icon = escHtml(gridFightTraitIconUrl(item.icon as string));
  const thresholdLayers = special ? special.thresholds : layers;
  const thresholds = thresholdLayers.map((layer) => `<span class="nk-cwtp__threshold" data-quality="${qualityClass(layer.quality)}">${layer.layer}</span>`).join('<span class="nk-cwtp__threshold-sep">/</span>');
  const baseFull = fmtDesc(item.desc as string, item.base_params as number[]);
  const baseSimple = fmtDesc((item.simple_desc as string) || (item.desc as string), item.base_params as number[]);
  const notesFull = remarks
    .map((remark) => `<p class="nk-cwtp__note nk-cwtp__full">${fmtDesc(remark.desc, remark.params)}</p>`)
    .join('');
  const notesSimple = remarks
    .map((remark) => `<p class="nk-cwtp__note nk-cwtp__simple">${fmtDesc(remark.simple_desc, remark.params)}</p>`)
    .join('');

  return `<article class="nk-cwtp" data-cat="${cat}">
      <input id="nk-cwtp-mode" class="nk-cwtp__mode" type="checkbox">
      <header class="nk-cwtp__head">
        <span class="nk-cwtp__sigil"><img data-cdn-src="${icon}" alt="" fetchpriority="high"></span>
        <div class="nk-cwtp__ident">
          <div class="nk-cwtp__eyebrow">
            <span class="nk-cwtp__cat" data-cat="${cat}">${escHtml(catLabel(cat))}</span>
            <span class="nk-cwtp__rubric">№ ${escHtml(id)}</span>
          </div>
          <h2 class="nk-cwtp__name"><a href="${detailHref}" title="${escHtml(t('card.viewDetail', { name: item.name }))}">${escHtml(item.name)}<span class="nk-cwtp__name-arrow" aria-hidden="true">↗</span></a></h2>
          ${thresholds ? `<div class="nk-cwtp__thresholds" aria-hidden="true">${thresholds}</div>` : ''}
        </div>
        <label class="nk-cwtp__switch" for="nk-cwtp-mode" title="${escHtml(t('cwRole.simple'))}">
          <span class="nk-cwtp__switch-text">${escHtml(t('cwRole.simple'))}</span>
          <span class="nk-cwtp__switch-track"><span class="nk-cwtp__switch-knob"></span></span>
        </label>
      </header>
      <div class="nk-cwtp__body">
        <section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${escHtml(t('ctrait.sec.effect'))}</h3>
          <div class="nk-cwtp__effect nk-cwtp__full">${baseFull}</div>
          <div class="nk-cwtp__effect nk-cwtp__simple">${baseSimple}</div>
          ${notesFull || notesSimple ? `<div class="nk-cwtp__notes">${notesFull}${notesSimple}</div>` : ''}
        </section>

        ${special && special.kind === 'rules'
          ? `<section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${escHtml(t('ctrait.sec.rules'))}</h3>
          ${renderRules(special.rules || [])}
        </section>`
          : layers.length
            ? `<section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${escHtml(t('ctrait.sec.layers'))}</h3>
          <ol class="nk-cwtp__tiers">${layers.map((layer) => renderTier(layer, special && special.kind === 'astropolis' ? 'level' : 'people')).join('')}</ol>
        </section>`
            : ''}

        ${members.length ? `<section class="nk-cwtp__sec">
          <h3 class="nk-cwtp__sec-title">${escHtml(t('ctrait.sec.members'))}<span class="nk-cwtp__sec-note">${escHtml(t('ctrait.memberCount', { n: members.length }))}</span></h3>
          ${renderMembers(members)}
        </section>` : ''}
      </div>
    </article>`;
}

export const currencyTraitPage: CatalogPageConfig = {
  id: 'currency-trait',
  titleKey: 'catalog.titleWithMode',
  titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwTrait' },
  headless: true,
  searchKey: 'catalog.cwTrait.search',
  gridClass: 'nk-cw-trait-grid',
  skeleton: { variant: 'row' },
  styles: [loadCwCatalogCss, loadCwTraitBrowserCss],
  async fetchData(ctx) {
    const [{ traits, season }, { roles }] = await Promise.all([
      loadLocalCurrencyTraits(),
      loadLocalCurrencyRoles(),
    ]);
    const currentSeason = ctx?.cwSeason ?? season?.id ?? null;
    const scoped = currentSeason == null ? traits : traits.filter((t) => t.season_id === currentSeason);

    const membersByTrait = new Map<number, TraitMember[]>();
    for (const role of roles) {
      for (const traitId of role.trait_list) {
        const list = membersByTrait.get(traitId);
        const member = { id: role.id, name: role.name, avatar_id: role.avatar_id, rarity: role.rarity };
        if (list) list.push(member);
        else membersByTrait.set(traitId, [member]);
      }
    }

    return scoped.map((trait) => ({
      id: String(trait.id),
      name: trait.name,
      href: activeHref(`/currency/trait/${trait.id}`),
      icon: trait.icon,
      mini_icon: trait.mini_icon,
      cat: trait.cat,
      desc: trait.desc,
      simple_desc: trait.simple_desc,
      base_params: trait.base_params,
      activation_type: trait.activation_type,
      season_id: trait.season_id,
      layers: trait.layers,
      special: (trait as { special?: unknown }).special ?? null,
      remarks: trait.remarks,
      package: trait.package,
      members: membersByTrait.get(trait.id) ?? [],
    }));
  },
  buildFilters(items: CatalogItem[]) {
    const present = new Set(items.map((item) => item.cat as string).filter(Boolean));
    const cats = CAT_ORDER.filter((cat) => present.has(cat));
    const filters: CatalogFilter[] = [];
    if (cats.length) {
      filters.push({
        key: 'cat',
        labelKey: 'catalog.filter.category',
        options: cats.map((cat) => ({ val: cat, labelKey: cwTraitCatKey(cat)! })),
      });
    }
    return filters;
  },
  split: {
    tabFilterKey: 'cat',
    tabGroupLabelKey: 'nav.cwTrait',
    railLabelKey: 'nav.cwTrait',
    renderDetail: (item) => renderTraitDetail(item),
  },
  renderCard: (item, i) => renderTraitCard(item, i),
};

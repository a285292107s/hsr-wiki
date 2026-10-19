import { SITE_NAME } from '../lib/constants';
import { translate } from './i18n';

export function pageTitle(name?: string): string {
  const game = `${translate('meta.gameName')} Wiki`;
  return name ? `${name} - ${game} | ${SITE_NAME}` : `${game} | ${SITE_NAME}`;
}

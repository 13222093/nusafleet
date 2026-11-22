// Sidebar tab: the recommended plan for the current supply scenario, and the
// alternatives the user has pinned, compared on the same three numbers.
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Eye, Lightbulb, Trash2 } from 'lucide-react';

import { num, rpBn, t } from '../i18n';
import { tripsAvoided } from '../recommend';
import type { Alternative, Recommendation } from '../recommend';
import type { Kpis, Lang, ParetoPoint } from '../types';

interface Props {
  lang: Lang;
  alts: Alternative[];
  onShow: (alt: Alternative) => void;
  onRemove: (id: string) => void;
  recommendation: Recommendation;
  recommendationBase: Kpis;
  scenarioName: string;
  onShowRecommendation: () => void;
}

const signed = (lang: Lang, v: number, digits = 0) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${num(lang, Math.abs(v), digits)}`;

function Numbers({ lang, plan, base }: { lang: Lang; plan: ParetoPoint; base: Kpis }) {
  const cost = (plan.cost_rp - base.annual_cost_rp) / 1e9;
  const co2 = plan.co2_t - base.co2_t;
  const items: [string, string][] = [
    [`${signed(lang, cost, 1)}`, t(lang, 'altCost')],
    [`${signed(lang, co2)} t`, 'CO2'],
    [`${signed(lang, tripsAvoided(plan, base))}`, t(lang, 'altTrips')],
    [String(plan.chargers.length), t(lang, 'stations')],
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', justifyContent: 'space-between', columnGap: 1, mt: 1 }}>
      {items.map(([value, label]) => (
        <Box key={label}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{value}</Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.2 }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

const action = { height: 30, px: 1.25, gap: 0.5, borderRadius: '999px', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700, border: '1px solid #dde6e4', color: 'text.primary', '&:hover': { borderColor: '#06252b' }, '&.Mui-focusVisible': { outline: '2px solid #009688', outlineOffset: 2 } } as const;

export function AlternativesPanel({ lang, alts, onShow, onRemove, recommendation, recommendationBase, scenarioName, onShowRecommendation }: Props) {
  const cheapest = alts.length > 1 ? alts.reduce((a, b) => (b.plan.cost_rp < a.plan.cost_rp ? b : a)).id : null;
  const cleanest = alts.length > 1 ? alts.reduce((a, b) => (b.plan.co2_t < a.plan.co2_t ? b : a)).id : null;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ p: 2.5, borderRadius: '20px', bgcolor: '#e3f5f1', border: '1px solid #b8e2da' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#00695c' }}>
          <Lightbulb size={18} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
            {t(lang, 'recTitle')}, {scenarioName}
          </Typography>
        </Box>
        <Typography sx={{ mt: 0.75, fontSize: '0.9rem', lineHeight: 1.4 }}>{t(lang, recommendation.rule === 'noRegret' ? 'recRuleNoRegret' : 'recRuleCheapest')}</Typography>
        <Numbers lang={lang} plan={recommendation.point} base={recommendationBase} />
        <Typography sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
          {t(lang, 'totalCost')} {rpBn(lang, recommendation.point.cost_rp)}, {t(lang, 'kpiCapex').toLowerCase()} {rpBn(lang, recommendation.point.capex_rp, 0)}
        </Typography>
        <ButtonBase onClick={onShowRecommendation} sx={{ ...action, mt: 1.5, bgcolor: '#06252b', color: '#ffffff', borderColor: '#06252b' }}>
          <Eye size={14} />
          {t(lang, 'showOnMap')}
        </ButtonBase>
      </Box>

      <Card>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t(lang, 'altTitle')}
          </Typography>
          {alts.length === 0 ? (
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.45 }}>{t(lang, 'altEmpty')}</Typography>
          ) : (
            <Box sx={{ display: 'grid' }}>
              {alts.map((alt, k) => (
                <Box key={alt.id} sx={{ py: 1.75, borderTop: k === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.3 }}>
                      {String.fromCharCode(65 + k)}. {alt.name}
                    </Typography>
                    {alt.id === cheapest ? <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#8a5a00' }}>{t(lang, 'cheapest').toLowerCase()}</Typography> : null}
                    {alt.id === cleanest ? <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#00695c' }}>{t(lang, 'cleanest').toLowerCase()}</Typography> : null}
                  </Box>
                  <Numbers lang={lang} plan={alt.plan} base={alt.base} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.25 }}>
                    <ButtonBase onClick={() => onShow(alt)} sx={action}>
                      <Eye size={14} />
                      {t(lang, 'showOnMap')}
                    </ButtonBase>
                    <ButtonBase onClick={() => onRemove(alt.id)} aria-label={`${t(lang, 'remove')} ${alt.name}`} sx={{ ...action, color: 'text.secondary' }}>
                      <Trash2 size={14} />
                      {t(lang, 'remove')}
                    </ButtonBase>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

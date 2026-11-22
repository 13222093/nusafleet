// KPI card from the Kopibara dashboard, with an "estimate" chip and a free-text
// comparison line instead of a fixed trend label.
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  /** Comparison line under the value, e.g. "-24% vs today's fleet". */
  note?: string;
  /** good = green, bad = red, neutral = secondary text. */
  tone?: 'good' | 'bad' | 'neutral';
  unit?: string;
  estimateLabel: string;
  estimateHint: string;
}

export function EstimateChip({ label, hint }: { label: string; hint: string }) {
  return (
    <Box component="span" title={hint} sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#52606a', borderBottom: '1px dotted #8d9aa3', cursor: 'help', whiteSpace: 'nowrap' }}>
      {label}
    </Box>
  );
}

export function KPICard({ title, value, icon: Icon, note, tone = 'neutral', unit, estimateLabel, estimateHint }: KPICardProps) {
  const noteColor = tone === 'good' ? 'success.dark' : tone === 'bad' ? 'error.main' : 'text.secondary';
  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
          <Typography color="text.secondary" variant="subtitle2" component="div" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {title}
          </Typography>
          <Box sx={{ color: 'text.secondary', display: 'flex' }}>
            <Icon size={18} />
          </Box>
        </Box>
        <Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', fontSize: { xs: '1.6rem', lg: '1.75rem' } }}>
            {value}
            {unit ? (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                {unit}
              </Typography>
            ) : null}
          </Typography>
          {note ? (
            <Typography variant="caption" sx={{ color: noteColor, display: 'block', mt: 0.75, fontWeight: 500 }}>
              {note}
            </Typography>
          ) : null}
          <Box sx={{ mt: 1 }}>
            <EstimateChip label={estimateLabel} hint={estimateHint} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

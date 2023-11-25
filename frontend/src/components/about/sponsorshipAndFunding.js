import { OverlayListDisplay } from '../common/overlayListDisplay.js';
import {
  TheWorldBankIcon,
  AmericanRedCrossIcon,
  UsAidIcon,
  MsfIcon,
  BritishRedCrossIcon,
  BingIcon,
} from '../svgIcons/organisations';
import messages from './messages';

const organizations = [
  {
    url: 'https://www.redcross.org/',
    name: 'American Red Cross',
    Icon: AmericanRedCrossIcon,
  },
  {
    url: 'https://www.redcross.org.uk/',
    name: 'British Red Cross',
    Icon: BritishRedCrossIcon,
  },
  {
    url: 'https://www.msf.org/',
    name: 'Medecins Sans Frontieres',
    Icon: MsfIcon,
  },
  { url: 'https://www.worldbank.org/', name: 'World Bank', Icon: TheWorldBankIcon },
  { url: 'https://www.usaid.gov/', name: 'USAID', Icon: UsAidIcon },
  { url: 'https://www.bing.com/', name: 'Bing', Icon: BingIcon },
];

export function SponsorshipAndFunding() {
  return (
    <OverlayListDisplay
      variant="light"
      title={messages.sponsorshipAndFunding}
      description={messages.sponsorshipAndFundingDesc}
      organizations={organizations}
      contactTitle={messages.applySponsorship}
    />
  );
}

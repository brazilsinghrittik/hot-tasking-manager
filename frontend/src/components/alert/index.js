import { BanIcon, CheckIcon, InfoIcon, AlertIcon } from '../svgIcons';

export const Alert = ({ type = 'info', compact = false, inline = false, children }) => {
  const icons = {
    info: InfoIcon,
    success: CheckIcon,
    warning: AlertIcon,
    error: BanIcon,
  };
  const Icon = icons[type];

  const color = {
    info: 'b--blue bg-lightest-blue',
    success: 'b--dark-green bg-washed-green',
    warning: 'b--gold bg-washed-yellow',
    error: 'b--dark-red bg-washed-red',
  };
  const iconColor = {
    info: 'blue',
    success: 'dark-green',
    warning: 'gold',
    error: 'dark-red',
  };

  return (
    <div
      className={`${inline ? 'di' : 'db'} blue-dark bl bw2 br2 ${compact ? 'pa2' : 'pa3'} ${
        color[type]
      }`}
    >
      <Icon className={`h1 w1 v-top mr2 ${iconColor[type]}`} />
      {children}
    </div>
  );
};

import React from 'react';

export class SidebarIcon extends React.PureComponent {
  render() {
    return (
      <svg width="20px" height="20px" viewBox="0 0 20 20" {...this.props}>
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <rect stroke="currentColor" x="0.5" y="3.5" width="19" height="13" rx="2"></rect>
          <rect fill="currentColor" x="13" y="5" width="5" height="10"></rect>
        </g>
      </svg>
    );
  }
}

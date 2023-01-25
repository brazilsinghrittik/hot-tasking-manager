import React from 'react';
import { useFetchWithAbort } from '../../hooks/UseFetch';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import './styles.scss';

function TopBanner() {
  const [, error, data] = useFetchWithAbort(`system/banner/`);

  return (
    <>
      {data.visible && !error && (
        <div className="ph3 b--grey-light bb bg-tan top-banner-container">
          <div
            className="fw6 flex justify-center"
            dangerouslySetInnerHTML={htmlFromMarkdown(data.message)}
          />
        </div>
      )}
    </>
  );
}

export default TopBanner;

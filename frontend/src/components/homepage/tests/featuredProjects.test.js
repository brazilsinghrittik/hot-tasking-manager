import React from 'react';
import TestRenderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';
import { FeaturedProjects } from '../featuredProjects';

const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('featuredProjects area begins rendering with correct English title in first span', () => {
  const testFeaturedProjects = createComponentWithIntl(<FeaturedProjects />);
  const testInstance = testFeaturedProjects.root;

  expect(testInstance.findByProps({ className: 'f2 ttu barlow-condensed fw8' }).type).toBe('h3');
});

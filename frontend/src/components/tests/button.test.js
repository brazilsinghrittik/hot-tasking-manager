import React from 'react';
import TestRenderer from 'react-test-renderer';

import { Button } from '../button';


it('children and onClick props of Button', () => {
  let testVar;
  const testButton = TestRenderer.create(
    <Button className="black bg-white" onClick={() => testVar=true}>Test it</Button>
  );
  const buttonInstance = testButton.root;
  expect(
    buttonInstance.findByProps(
      {'className': 'black bg-white br1 f5 bn pointer'}
    ).children
  ).toEqual(["Test it"]);

  buttonInstance.findByProps(
    {'className': 'black bg-white br1 f5 bn pointer'}
  ).props.onClick();
  expect(testVar).toEqual(true);
});

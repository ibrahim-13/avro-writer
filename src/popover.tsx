import React, { useState } from 'react';
import { VirtualElement } from '@popperjs/core';
import { usePopper } from 'react-popper';

const ve: VirtualElement = {
  getBoundingClientRect: () => ({
    width: 0,
    height: 0,
    top: 50,
    bottom: 50,
    right: 750,
    left: 750,
  })
}

export const SuggestionPopover = (): JSX.Element => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(ve, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });

  return (
    <>
      <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        <div style={{ background: 'white', color: 'black'}}> ggwp </div>
        <div ref={setArrowElement} style={styles.arrow} />
      </div>
    </>
  );
};
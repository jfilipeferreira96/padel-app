import React, { ReactElement } from 'react';
import styled, { css } from 'styled-components';

/**
 * `Props` type.
 */

type Props = {
  color?: string,
  icon: string,
  size: string | unknown
  margin?: string,
  active?: boolean,
  onClick?: (() => void )| ((e:React.SyntheticEvent) => void)
};

/**
 * `Wrapper` styled component.
 */

const Wrapper = styled.span`
  display: inline-block;
  line-height: 0;
  position: relative;
`;

/**
 * `Svg` component.
 */

const Svg = ({ icon, ...rest }: Props): ReactElement => {
  const innerHtml = {
    __html: icon // eslint-disable-line id-match
  };

  return (
    <Wrapper
      {...rest}
      dangerouslySetInnerHTML={innerHtml}
    />
  );
};

/**
 * Export `Svg` component.
 */

export default Svg;

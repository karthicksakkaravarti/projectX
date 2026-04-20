import * as React from "react"
import type { SVGProps } from "react"

const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={64}
    height={64}
    viewBox="0 0 64 64"
    fill="none"
    {...props}
  >
    <g clipPath="url(#minimax)">
      <rect width={64} height={64} rx={12} fill="#F23F5D" />
      <path
        fill="#fff"
        d="M14 18h5.5l6.5 14.5L32.5 18H38v28h-5V28.2l-5.8 12.8h-2.4L19 28.2V46h-5V18Zm28 0h5v28h-5V18Z"
      />
    </g>
    <defs>
      <clipPath id="minimax">
        <path fill="#fff" d="M0 0h64v64H0z" />
      </clipPath>
    </defs>
  </svg>
)
export default Icon

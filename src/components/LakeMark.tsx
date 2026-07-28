type LakeMarkProps = {
  className?: string;
};

export default function LakeMark({ className = "" }: LakeMarkProps) {
  return (
    <svg
      className={`lake-mark ${className}`.trim()}
      viewBox="0 0 760 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="lake-mark-arch"
        d="M142 414V218C142 104 238 24 380 24s238 80 238 194v196"
      />
      <path
        className="lake-mark-inner"
        d="M184 414V222C184 132 261 67 380 67s196 65 196 155v192"
      />
      <circle className="lake-mark-sun" cx="470" cy="168" r="42" />
      <path
        className="lake-mark-shore"
        d="M186 280c72-26 135-19 195 2 70 25 127 15 194-14"
      />
      <path
        className="lake-mark-water lake-mark-water-one"
        d="M154 323c76-17 151-16 226 0 75 17 150 17 226 0"
      />
      <path
        className="lake-mark-water lake-mark-water-two"
        d="M176 354c62-13 124-13 186 0 62 14 124 14 186 0"
      />
      <path
        className="lake-mark-water lake-mark-water-three"
        d="M220 386c46-9 92-9 138 0 46 10 92 10 138 0"
      />
      <path
        className="lake-mark-reed"
        d="M231 304c-6-32-4-66 7-101m-7 101c-20-26-30-54-30-84m30 84c17-21 28-45 32-73"
      />
      <path
        className="lake-mark-reed"
        d="M540 293c7-25 7-52 0-81m0 81c18-23 28-49 31-78"
      />
    </svg>
  );
}

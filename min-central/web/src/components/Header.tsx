interface HeaderProps {
  title: string;
  subtitle: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const Header = ({ title, subtitle, buttonText, onButtonClick }: HeaderProps) => {
  return (
    <div className="page-header">
      <div className="page-title">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {buttonText && onButtonClick && (
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onButtonClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {buttonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
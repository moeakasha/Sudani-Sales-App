import { Logo } from './Logo';
import LanguageIcon from '@mui/icons-material/Language';
import './Header.css';

export const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <Logo />
        </div>
        <button className="language-button" type="button">
          <span className="language-text">Language</span>
          <LanguageIcon className="globe-icon" />
        </button>
      </div>
    </header>
  );
};


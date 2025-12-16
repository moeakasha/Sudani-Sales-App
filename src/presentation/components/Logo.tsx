import logo from '../../assets/Logo.svg';
import './Logo.css';

export const Logo = () => {
  return (
    <div className="logo-container">
      <img src={logo} alt="Logo" className="logo" />
    </div>
  );
};


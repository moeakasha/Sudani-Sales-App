import Lottie from 'lottie-react';
import footerAnimation from '../../assets/footer-animation.json';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-animation-container">
        <Lottie 
          animationData={footerAnimation}
          loop={false}
          autoplay={true}
          className="footer-animation"
        />
      </div>
    </footer>
  );
};


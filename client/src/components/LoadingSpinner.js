import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ fullPage = false }) => {
  return (
    <div className={`d-flex justify-content-center align-items-center ${fullPage ? 'position-fixed top-0 start-0 w-100 h-100 bg-white bg-opacity-75 z-index-1000' : ''}`}>
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Carregando...</span>
      </Spinner>
    </div>
  );
};

export default LoadingSpinner;
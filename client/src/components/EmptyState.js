import React from 'react';
import { Card, Button } from 'react-bootstrap';

const EmptyState = ({ title, message, buttonText, onButtonClick }) => {
    return (
        <Card className="text-center p-4 my-4 border-dashed">
            <Card.Body>
                <Card.Title as="h3" className="mb-2 text-dark">{title}</Card.Title>
                <Card.Text className="mb-3 text-muted mx-auto" style={{ maxWidth: '400px' }}>{message}</Card.Text>
                {buttonText && onButtonClick && (
                    <Button variant="primary" onClick={onButtonClick}>
                        {buttonText}
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
};

export default EmptyState;
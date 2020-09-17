import React from 'react';
import { Spinner } from 'react-bootstrap'
export default function Loading({ message }) {
    return (
        <div className="text-center">
            <Spinner animation="grow" />
            <p>Opening Portal</p>
        </div>
      )
}
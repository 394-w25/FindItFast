import React from 'react';
import { NavLink } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import './NavigationBar.css';

const NavigationBar = () => {
  return (
    <Navbar fixed="bottom" className="bg-light border-top">
      <Container className="d-flex justify-content-around">
        <Nav className="w-100 d-flex justify-content-between">
          <Nav.Link as={NavLink} to="/found" className="nav-icon" activeclassname="active">
            <i className="bi bi-search"></i>
            <p>Found Feed</p>
          </Nav.Link>
          {/* <Nav.Link as={NavLink} to="/claimed" className="nav-icon" activeclassname="active">
            <i className="bi bi-search"></i>
            <p>Claimed Feed</p>
          </Nav.Link> */}
          <Nav.Link as={NavLink} to="/postfound" className="nav-icon" activeclassname="active">
            <i className="bi bi-plus-circle-fill"></i>
            <p>Post Found</p>
          </Nav.Link>

          <Nav.Link as={NavLink} to="/messages" className="nav-icon" activeclassname="active">
            <i className="bi bi-chat-dots-fill"></i>
            <p>Messages</p>
          </Nav.Link>

          <Nav.Link as={NavLink} to="/profile" className="nav-icon" activeclassname="active">
            <i className="bi bi-person-fill"></i>
            <p>Profile</p>
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;

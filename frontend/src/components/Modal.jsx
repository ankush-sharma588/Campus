import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

function ModalBox({ show, close, header, body, btn, confirmAction }) {
  return (
    <>
      <Modal
        show={show}
        onHide={close}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{header}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>
            Close
          </Button>
          <Button variant="danger" onClick={confirmAction}>
            {btn}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ModalBox;

ModalBox.propTypes = {
  show: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  header: PropTypes.node,
  body: PropTypes.node,
  btn: PropTypes.node,
  confirmAction: PropTypes.func.isRequired,
};

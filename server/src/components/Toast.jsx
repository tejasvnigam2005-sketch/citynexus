export default function Toast({ message, type, visible }) {
  return (
    <div className={`toast${visible ? ' visible' : ''}${type === 'error' ? ' error' : ''}`}>
      <i className={`fas ${type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`} />
      {message}
    </div>
  );
}

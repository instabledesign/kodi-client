export default callback => (notification, messageEvent) => {
    console.log('Notification %o.', notification, messageEvent);

    callback(notification, messageEvent);
}
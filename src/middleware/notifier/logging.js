export default handler => (notification, messageEvent) => {
    console.log('Notification %o.', notification, messageEvent);

    handler(notification, messageEvent);
}
self.addEventListener("install", (event) => {
  console.log(event);
});

self.addEventListener("push", (event) => {
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return;
  }

  const data = event.data ? event.data.json() : {};

  event.waitUntil(self.registration.showNotification(data.title || "", data));
});

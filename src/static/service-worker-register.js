(async () => {
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported.");
    return;
  }

  try {
    navigator.serviceWorker.ready.then(async (serviceWorkerRegistration) => {
      if ((await serviceWorkerRegistration.pushManager.getSubscription())) {
        return;
      }

      await Notification.requestPermission();

      const applicationServerKey =
        (await (await fetch("/api/web-push/subscribe/key", {
          method: "POST",
        })).json())
          .publicKey || "";

      const subscription = (await serviceWorkerRegistration.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })).toJSON();

      await fetch(`/api/web-push/subscribe/${applicationServerKey}`, {
        method: "PUT",
        body: JSON.stringify(
          subscription,
        ),
      });
    });

    await navigator.serviceWorker.register(
      `${window._basePath || ""}/service-worker.js`,
      { scope: `${window._basePath}/` },
    );
  } catch (error) {
    console.error(error);
  }
})();

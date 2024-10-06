(async () => {
  /**
   * @param {string} path
   * @return {string}
   */
  const getPath = (path) => {
    return `${path}`;
  };

  /**
   * @return {Promise<string>}
   */
  const getApplicationServerKey = async () => {
    const response = await fetch(getPath("/api/web-push/subscribe/key"), {
      method: "POST",
    });

    return (await response.json()).publicKey || "";
  };

  /**
   * @param {ServiceWorkerRegistration} registration
   * @param {string} applicationServerKey
   * @return {Promise<PushSubscription>}
   */
  const getSubscription = async (registration, applicationServerKey) => {
    return await registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
  };

  /**
   * @param {ServiceWorkerRegistration} registration
   * @return {Promise<void>}
   */
  const subscribe = async (registration) => {
    const applicationServerKey = await getApplicationServerKey();
    const subscription = await getSubscription(
      registration,
      applicationServerKey,
    );

    await fetch(
      getPath(`/api/web-push/subscribe/${applicationServerKey}`),
      {
        method: "PUT",
        body: JSON.stringify(
          subscription.toJSON(),
        ),
      },
    );
  };

  try {
    if (!("serviceWorker" in navigator)) {
      throw new error("Service workers are not supported.");
    }

    navigator.serviceWorker.ready.then(async (registration) => {
      if ((await registration.pushManager.getSubscription())) {
        return;
      }

      await Notification.requestPermission();
      await subscribe(registration);
    });

    await navigator.serviceWorker.register(
      getPath("/service-worker.js"),
      { scope: getPath("/") },
    );
  } catch (error) {
    console.error(error);
  }
})();

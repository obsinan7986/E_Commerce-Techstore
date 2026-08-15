const STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

const OrderStatusTimeline = ({ status }) => {
  if (status === "Cancelled") {
    return (
      <div className="order-timeline cancelled">
        <div className="order-timeline-step active cancelled-step">
          <span className="dot" />
          <span>Order Cancelled</span>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="order-timeline">
      {STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isActive = index === currentIndex;

        return (
          <div
            key={step}
            className={`order-timeline-step ${isComplete ? "complete" : ""} ${
              isActive ? "active" : ""
            }`}
          >
            <span className="dot" />
            <span>{step === "Pending" ? "Order Placed" : step}</span>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusTimeline;

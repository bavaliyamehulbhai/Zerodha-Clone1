import React from "react";

function LeftSection({
  imageURL,
  productName,
  productDescription,
  tryDemo,
  learnMore,
  googlePlay,
  appStore,
}) {
  return (
    <div className="container mt-5 mb-5">
      <div className="row">
        <div className="col-md-6 p-5">
          <img src={imageURL} alt={productName} className="img-fluid" />
        </div>
        <div className="col-md-6 p-5 mt-5">
          <h1>{productName}</h1>
          <p>{productDescription}</p>
          <div className="mb-3">
            <a href={tryDemo} className="me-5" style={{textDecoration:"none"}}>Try Demo &nbsp; <i className="fa fa-long-arrow-right" aria-hidden="true"></i></a>
            <a href={learnMore} className="ms-5" style={{textDecoration:"none"}}>
              Learn More &nbsp; <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
          <div className="mt-3">
            <a href={googlePlay}>
              <img
                src="media/Images/googlePlayBadge.svg"
                alt="Get it on Google Play"
              />
            </a>
            <a href={appStore} className="ms-3">
              <img
                src="media/Images/appStoreBadge.svg"
                alt="Download on the App Store"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftSection;

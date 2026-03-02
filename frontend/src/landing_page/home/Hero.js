import React from 'react';

function Hero() {
    return ( 
        <div className='container p-5 mb-5'>
            <div className="row text-center">
                <img src='media/Images/homeHero.png' alt='Home Page' className='mb-5'/>
                <h1 className='mt-5'> Invest in Everything</h1>
                <p>Online plateform to invest in stocks, dericatives, mutual funds and more.</p>
                <button className=' p-2 btn btn-primary fs-5 mb-5'style={{width: "20%", margin: "0 auto"}}>Signup Now</button>
            </div>
        </div>
     );
}

export default Hero;
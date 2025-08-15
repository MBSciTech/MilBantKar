import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/login");
        }, 2000);

        return () => clearTimeout(timer); // cleanup in case component unmounts
    }, [navigate]);

    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-primary">
            <div className="card shadow-lg p-4 text-center" style={{ maxWidth: "400px" }}>
                <h1 className="text-primary mb-3">
                    Welcome to <br /> <span className="fw-bold">मिल बांट कर 🙏</span>
                </h1>
                <p className="text-muted mb-4">Loading, please wait...</p>

                {/* Bootstrap spinner */}
                <div
                style={{
                    justifyContent:'center',
                    alignItems:'Center',
                    display:'flex',
                    
                }}
                 className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    );
}

export default Welcome;

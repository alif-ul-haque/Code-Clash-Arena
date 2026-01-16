import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mainLogo from '../../assets/icons/cca.png'
import '../style/SignupPage.css'
import Button from '../../assets/components/Button'
import bg from '../../assets/images/wallpaperflare.com_wallpaper.jpg'

export default function SignupPage() {
    const navigate = useNavigate()
    const [alert, setAlert] = useState(null)

    let [error, detectError] = useState({
        email: false,
        cfhandle: false,
        password: false
    })
    let [formData, setFormData] = useState({
        email: "",
        cfhandle: "",
        password: ""
    })

    let handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currData) => {
            const newData = { ...currData, [name]: value };
            const allFilled = Object.values(newData).every(val => val !== "");

            if (allFilled) {
                detectError({
                    email: false,
                    cfhandle: false,
                    password: false
                });
            } else {
                detectError((currErrors) => ({
                    ...currErrors,
                    [name]: value === ""
                }));
            }

            return newData;
        });
    }

    let handleSubmit = async (event) => {
        event.preventDefault();
        const newErrors = {};
        Object.entries(formData).forEach(([key, value]) => {
            newErrors[key] = value === "";
        });
        detectError(newErrors);
        const hasErrors = Object.values(newErrors).some(err => err);
        if (!hasErrors) {
            // Store user data in localStorage
            localStorage.setItem('userId', formData.username)
            localStorage.setItem('userProfile', JSON.stringify({
                username: formData.username,
                email: formData.email,
                cfhandle: formData.cfhandle,
                signupTime: new Date().toISOString()
            }))
            
            setFormData({
                email: "",
                cfhandle: "",
                password: ""
            });
            detectError({
                email: false,
                cfhandle: false,
                password: false
            });
            // Navigate to main page on successful signup
            setTimeout(() => {
                navigate('/');
            }, 1500);
        }
    }

    const pageStyles = {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
    }

    return (
        <div className="signupPage" style={pageStyles}>
            <div className="formDiv">
                <img src={mainLogo} alt="image" id="mainlogo" />
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder=' '
                            name="email"
                            onChange={handleChange}
                            value={formData.email}
                            id="email"
                        />
                        <label
                            htmlFor="email"
                            style={error.email ? { color: 'red' } : {}}
                        >Email</label>
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder=' '
                            name="username"
                            onChange={handleChange}
                            value={formData.username}
                            id="username"
                        />
                        <label htmlFor="username" style={error.username ? { color: 'red' } : {}}>Username</label>
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder=' '
                            name="cfhandle"
                            onChange={handleChange}
                            value={formData.cfhandle}
                            id="cfhandle"
                        />
                        <label htmlFor="cfhandle" style={error.cfhandle ? { color: 'red' } : {}}>Codeforces Handle</label>
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder=' '
                            name="password"
                            onChange={handleChange}
                            value={formData.password}
                            id="password"
                        />
                        <label htmlFor="password" style={error.password ? { color: 'red' } : {}}>Password</label>
                    </div>
                    <Button backgroundColor='#176161' text='SignUp' height='80px' width='300px' color='black' fontSize='30px' />
                    <p style={{ textAlign: 'center', marginTop: '-1.5 rem', color: '#ffffff' }}>
                        Have an account? <span onClick={() => navigate('/login')} style={{ color: '#FFD700', cursor: 'pointer', fontWeight: 'bold' }}>Log in</span>
                    </p>
                </form>
            </div>

            {/* Alert Popup */}
            {alert && (
                <AlertPage
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                />
            )}
        </div>
    )
}
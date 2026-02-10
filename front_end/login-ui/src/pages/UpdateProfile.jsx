import { useState } from "react";
import "../styles/updateProfile.css";

function UpdateProfile() {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedStep, setCompletedStep] = useState(0);

    const [basicInfo, setBasicInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    fatherName: "",
    motherName: "",
  });

    const [error, setError] = useState("");

    const handleChange = (e) => {
    setBasicInfo({
      ...basicInfo,
      [e.target.name]: e.target.value,
    });
  };

    const handleSaveContinue = () => {
    setError("");

    if (
      !basicInfo.firstName ||
      !basicInfo.lastName ||
      !basicInfo.dob ||
      !basicInfo.fatherName ||
      !basicInfo.motherName
    ) {
      setError("Please fill all required fields");
      return;
    }

    // 🔹 For now just log (later API call)
    console.log("Basic Info Saved:", basicInfo);

    alert("Basic Info saved successfully");
    setCurrentStep(2);
    setCompletedStep(1);

  };
    
    const [commInfo, setCommInfo] = useState({  
        phone: "",
        email: "",
        doorNo: "",
        address1: "",
        address2: "",
        taluk: "",
        district: "",
        state: "Tamil Nadu",
        country: "India",
        postalCode: "",
        });

    const handleCommChange = (e) => {
    setCommInfo({
        ...commInfo,
        [e.target.name]: e.target.value,
    });
    };

    const handleCommSave = () => {
    setError("");

    if (
        !commInfo.phone ||
        !commInfo.doorNo ||
        !commInfo.address1 ||
        !commInfo.address2 ||
        !commInfo.district ||
        !commInfo.postalCode
    ) {
        setError("Please fill all required fields");
        return;
    }

    const pin = Number(commInfo.postalCode);
    if (pin < 600001 || pin > 642207) {
        setError("Postal Code must be between 600001 and 642207");
        return;
    }

    console.log("Communication Info Saved:", commInfo);
    alert("Communication Info saved successfully");
    setCurrentStep(3); 
    setCompletedStep(2);
    };

    const [educationInfo, setEducationInfo] = useState({
        qualification: "",
        institution: "",
        board: "",
        yearOfPassing: "",
        score: "",
        });

    const handleEduChange = (e) => {
        setEducationInfo({
            ...educationInfo,
            [e.target.name]: e.target.value,
        });
        };

        const handleEduSave = () => {
        setError("");

        if (
            !educationInfo.qualification ||
            !educationInfo.institution ||
            !educationInfo.board ||
            !educationInfo.yearOfPassing ||
            !educationInfo.score
        ) {
            setError("Please fill all required fields");
            return;
        }

        console.log("Education Info Saved:", educationInfo);
        setCurrentStep(4); 
        setCompletedStep(3);
        };

        return (
            <div className="profile-bg">
                <div className="profile-container">
                    
                    <div className="step-indicator">
                    {/* STEP 1 */}
                    <div className={`step ${
                        completedStep >= 1 ? "completed" : currentStep === 1 ? "active" : ""
                    }`}>
                        <div className="circle">1</div>
                        <span>Basic</span>
                    </div>

                    <div className="line"></div>

                    {/* STEP 2 */}
                    <div className={`step ${
                        completedStep >= 2 ? "completed" : currentStep === 2 ? "active" : ""
                    }`}>
                        <div className="circle">2</div>
                        <span>Communication</span>
                    </div>

                    <div className="line"></div>

                    {/* STEP 3 */}
                    <div className={`step ${
                        completedStep >= 3 ? "completed" : currentStep === 3 ? "active" : ""
                    }`}>
                        <div className="circle">3</div>
                        <span>Education</span>
                    </div>

                    <div className="line"></div>

                    {/* STEP 4 */}
                    <div className={`step ${currentStep === 4 ? "active" : ""}`}>
                        <div className="circle">4</div>
                        <span>Beneficiary</span>
                    </div>
                    </div>


            {/* ================= STEP 1 ================= */}
            {currentStep === 1 && (
                <>
                <h2>Update Profile</h2>
                <p className="step-title">Step 1: Basic Information</p>

                <div className="form-group">
                    <label>First Name *</label>
                    <input
                    type="text"
                    name="firstName"
                    value={basicInfo.firstName}
                    onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Middle Name</label>
                    <input
                    type="text"
                    name="middleName"
                    value={basicInfo.middleName}
                    onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Last Name *</label>
                    <input
                    type="text"
                    name="lastName"
                    value={basicInfo.lastName}
                    onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                    type="date"
                    name="dob"
                    value={basicInfo.dob}
                    onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Father Name *</label>
                    <input
                    type="text"
                    name="fatherName"
                    value={basicInfo.fatherName}
                    onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Mother Name *</label>
                    <input
                    type="text"
                    name="motherName"
                    value={basicInfo.motherName}
                    onChange={handleChange}
                    />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button className="primary-btn" onClick={handleSaveContinue}>
                    Save & Continue
                </button>
                </>
            )}

            {/* ================= STEP 2 ================= */}
            {currentStep === 2 && (
                <>
                <p className="step-title">Step 2: Communication Information</p>

                <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                    type="text"
                    name="phone"
                    value={commInfo.phone}
                    onChange={handleCommChange}
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                    type="email"
                    name="email"
                    value={commInfo.email}
                    onChange={handleCommChange}
                    />
                </div>

                <div className="form-group">
                    <label>Door No *</label>
                    <input
                    type="text"
                    name="doorNo"
                    value={commInfo.doorNo}
                    onChange={handleCommChange}
                    />
                </div>

                <div className="form-group">
                    <label>Address Line 1 *</label>
                    <input
                    type="text"
                    name="address1"
                    value={commInfo.address1}
                    onChange={handleCommChange}
                    />
                </div>

                <div className="form-group">
                    <label>Address Line 2 *</label>
                    <input
                    type="text"
                    name="address2"
                    value={commInfo.address2}
                    onChange={handleCommChange}
                    />
                </div>

                <div className="form-group">
                    <label>Taluk</label>
                    <input
                    type="text"
                    name="taluk"
                    value={commInfo.taluk}
                    onChange={handleCommChange}
                    />
                </div>

                <div className="form-group">
                    <label>District *</label>
                    <select
                    name="district"
                    value={commInfo.district}
                    onChange={handleCommChange}
                    >
                    <option value="">Select District</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Salem">Salem</option>
                    <option value="Trichy">Trichy</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>State</label>
                    <input type="text" value="Tamil Nadu" disabled />
                </div>

                <div className="form-group">
                    <label>Country</label>
                    <input type="text" value="India" disabled />
                </div>

                <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                    type="text"
                    name="postalCode"
                    value={commInfo.postalCode}
                    onChange={handleCommChange}
                    />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button className="primary-btn" onClick={handleCommSave}>
                    Save & Continue
                </button>
                </>
            )}

                {/* ================= STEP 3 ================= */}
                {currentStep === 3 && (
                <>
                    <p className="step-title">Step 3: Education Information</p>

                    <div className="form-group">
                    <label>Highest Qualification *</label>
                    <select
                        name="qualification"
                        value={educationInfo.qualification}
                        onChange={handleEduChange}
                    >
                        <option value="">Select Qualification</option>
                        <option value="SSLC">SSLC</option>
                        <option value="HSC">HSC</option>
                        <option value="Diploma">Diploma</option>
                        <option value="UG">Undergraduate</option>
                        <option value="PG">Postgraduate</option>
                    </select>
                    </div>

                    <div className="form-group">
                    <label>Institution Name *</label>
                    <input
                        type="text"
                        name="institution"
                        value={educationInfo.institution}
                        onChange={handleEduChange}
                    />
                    </div>

                    <div className="form-group">
                    <label>Board / University *</label>
                    <input
                        type="text"
                        name="board"
                        value={educationInfo.board}
                        onChange={handleEduChange}
                    />
                    </div>

                    <div className="form-group">
                    <label>Year of Passing *</label>
                    <input
                        type="number"
                        name="yearOfPassing"
                        value={educationInfo.yearOfPassing}
                        onChange={handleEduChange}
                    />
                    </div>

                    <div className="form-group">
                    <label>Percentage / CGPA *</label>
                    <input
                        type="text"
                        name="score"
                        value={educationInfo.score}
                        onChange={handleEduChange}
                    />
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button className="primary-btn" onClick={handleEduSave}>
                    Save & Continue
                    </button>
                </>
                )}

    </div>
  </div>
);

}

export default UpdateProfile;

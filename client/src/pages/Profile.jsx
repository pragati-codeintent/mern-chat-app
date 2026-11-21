import { useEffect, useState } from "react";
import "./Profile.css";

function Profile({ userId, onClose, onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imageError, setImageError] = useState(false);

  const token = localStorage.getItem("token");

  // ==========================================
  // GET PROFILE
  // ==========================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `https://wink-chat-server.onrender.com/api/profile/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        console.log("PROFILE RESPONSE:", result);

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load profile"
          );
        }

        const data = result.user || result;

        setProfile(data);

        setName(data.name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setProfilePicture(data.profilePicture || "");

        setImageError(false);

        if (typeof onProfileUpdate === "function") {
          onProfileUpdate(data);
        }
      } catch (err) {
        console.error("Profile error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId && token) {
      fetchProfile();
    } else {
      setError("User is not logged in");
      setLoading(false);
    }
  }, [userId, token, onProfileUpdate]);

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    try {
      setSaving(true);

      const profileData = {
        name: cleanName,
        username: username.trim(),
        bio: bio.trim(),
        profilePicture: profilePicture.trim(),
      };

      const response = await fetch(
        `https://wink-chat-server.onrender.com/api/profile/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to update profile"
        );
      }

      const updatedUser = result.user || result;

      setProfile(updatedUser);

      setName(updatedUser.name || "");
      setUsername(updatedUser.username || "");
      setBio(updatedUser.bio || "");
      setProfilePicture(
        updatedUser.profilePicture || ""
      );

      setImageError(false);

      if (typeof onProfileUpdate === "function") {
        onProfileUpdate(updatedUser);
      }

      setEditing(false);
      setSuccess("Profile updated successfully");
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    setEditing(false);

    setName(profile?.name || "");
    setUsername(profile?.username || "");
    setBio(profile?.bio || "");
    setProfilePicture(
      profile?.profilePicture || ""
    );

    setImageError(false);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // CLOSE
  // ==========================================

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">

          <button
            type="button"
            className="profile-close"
            onClick={handleClose}
          >
            ×
          </button>

          <h1>Profile</h1>

          <p>Loading profile...</p>

        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !profile) {
    return (
      <div className="profile-page">
        <div className="profile-card">

          <button
            type="button"
            className="profile-close"
            onClick={handleClose}
          >
            ×
          </button>

          <h1>Profile</h1>

          <p className="profile-error">
            {error}
          </p>

          <button
            type="button"
            onClick={handleClose}
          >
            Back
          </button>

        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PROFILE
  // ==========================================

  return (
    <div className="profile-page">

      <div className="profile-card">

        {/* CLOSE BUTTON */}

        <button
          type="button"
          className="profile-close"
          onClick={handleClose}
        >
          ×
        </button>


        {/* TITLE */}

        <h1>Profile</h1>


        {/* PROFILE PHOTO */}

        <div className="profile-picture-container">

          {profilePicture && !imageError ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="profile-picture"
              onError={() => {
                console.error(
                  "Profile picture could not be loaded:",
                  profilePicture
                );

                setImageError(true);
              }}
            />
          ) : (
            <div className="profile-avatar">
              {(name || "P")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

        </div>


        {/* =====================================
            VIEW MODE
        ===================================== */}

        {!editing && (
          <>
            <div className="profile-info">

              {/* NAME */}

              <div className="profile-field">
                <label>Name</label>

                <p>
                  {profile?.name || "Not set"}
                </p>
              </div>


              {/* USERNAME */}

              <div className="profile-field">
                <label>Username</label>

                <p>
                  {profile?.username
                    ? `@${profile.username}`
                    : "Not set"}
                </p>
              </div>


              {/* EMAIL */}

              <div className="profile-field">
                <label>Email</label>

                <p>
                  {profile?.email ||
                    "Not available"}
                </p>
              </div>


              {/* BIO */}

              <div className="profile-field">
                <label>Bio</label>

                <p>
                  {profile?.bio ||
                    "No bio yet"}
                </p>
              </div>

            </div>


            {/* EDIT PROFILE */}

            {userId ===
              localStorage.getItem("userId") && (
              <button
                type="button"
                className="edit-profile-button"
                onClick={() => {
                  setEditing(true);

                  setError("");
                  setSuccess("");

                  setName(
                    profile?.name || ""
                  );

                  setUsername(
                    profile?.username || ""
                  );

                  setBio(
                    profile?.bio || ""
                  );

                  setProfilePicture(
                    profile?.profilePicture || ""
                  );

                  setImageError(false);
                }}
              >
                Edit Profile
              </button>
            )}

          </>
        )}


        {/* =====================================
            EDIT MODE
        ===================================== */}

        {editing && (
          <div className="edit-profile-form">

            {/* NAME */}

            <div className="profile-field">
              <label>Name *</label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Your name"
              />
            </div>


            {/* USERNAME */}

            <div className="profile-field">
              <label>Username</label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="username"
              />
            </div>


            {/* EMAIL */}

            <div className="profile-field">
              <label>Email</label>

              <input
                type="email"
                value={profile?.email || ""}
                disabled
              />
            </div>


            {/* BIO */}

            <div className="profile-field">
              <label>Bio</label>

              <textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                placeholder="Tell something about yourself"
                rows={3}
              />
            </div>


            {/* PROFILE PICTURE */}

            <div className="profile-field">
              <label>Profile Picture</label>

              <input
                type="url"
                value={profilePicture}
                onChange={(e) => {
                  setProfilePicture(
                    e.target.value
                  );

                  setImageError(false);
                }}
                placeholder="https://example.com/photo.jpg"
              />
            </div>


            {/* BUTTONS */}

            <div className="profile-buttons">

              <button
                type="button"
                className="save-profile-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>


              <button
                type="button"
                className="cancel-profile-button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

            </div>

          </div>
        )}


        {/* ERROR */}

        {error && profile && (
          <p className="profile-error">
            {error}
          </p>
        )}


        {/* SUCCESS */}

        {success && (
          <p className="profile-success">
            {success}
          </p>
        )}

      </div>

    </div>
  );
}

export default Profile;
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Address } from '../../context/AuthTypes';
import { X, User, MapPin, Plus, CheckCircle, Trash2, Home, Briefcase, Phone, Mail, Sparkles } from 'lucide-react';
import './ProfileModal.css';

interface ProfileModalProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = (props) => {
    const {
        user,
        updateProfile,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        isProfileModalOpen,
        closeProfileModal
    } = useAuth();

    const isOpen = props.isOpen !== undefined ? props.isOpen : isProfileModalOpen;
    const onClose = props.onClose || closeProfileModal;

    const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('addresses');

    // Profile form state
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [city, setCity] = useState(user?.city || '');
    const [stateVal, setStateVal] = useState(user?.state || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

    // Add Address form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [addrLabel, setAddrLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
    const [addrFullName, setAddrFullName] = useState(user?.name || '');
    const [addrPhone, setAddrPhone] = useState(user?.phone || '');
    const [addrStreet, setAddrStreet] = useState('');
    const [addrCity, setAddrCity] = useState(user?.city || '');
    const [addrDistrict, setAddrDistrict] = useState('');
    const [addrState, setAddrState] = useState('');
    const [addrPincode, setAddrPincode] = useState('');
    const [addrIsDefault, setAddrIsDefault] = useState(false);
    const [addrError, setAddrError] = useState('');
    const [isSavingAddr, setIsSavingAddr] = useState(false);

    if (!isOpen || !user) return null;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSuccessMsg('');

        const phoneDigits = phone.replace(/\D/g, '');
        if (phone && phoneDigits.length !== 10) {
            alert('Phone Number must be exactly 10 digits.');
            return;
        }

        setIsSavingProfile(true);
        const res = await updateProfile({
            name: name.trim(),
            phone: phoneDigits,
            city: city.trim(),
            state: stateVal.trim()
        });
        setIsSavingProfile(false);
        if (res.success) {
            setProfileSuccessMsg('Profile updated successfully!');
            setTimeout(() => setProfileSuccessMsg(''), 3000);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddrError('');

        if (!addrFullName.trim() || !addrPhone.trim() || !addrStreet.trim() || !addrCity.trim() || !addrPincode.trim()) {
            setAddrError('Please fill in all required address fields.');
            return;
        }

        const phoneDigits = addrPhone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            setAddrError('Phone Number must be exactly 10 digits.');
            return;
        }

        if (addrPincode.length < 6) {
            setAddrError('Please enter a valid 6-digit postal pincode.');
            return;
        }

        setIsSavingAddr(true);
        const res = await addAddress({
            label: addrLabel,
            fullName: addrFullName.trim(),
            phone: phoneDigits,
            street: addrStreet.trim(),
            city: addrCity.trim(),
            district: addrDistrict.trim() || addrCity.trim(),
            state: addrState.trim(),
            pincode: addrPincode.trim(),
            isDefault: addrIsDefault
        });
        setIsSavingAddr(false);

        if (res.success) {
            setShowAddForm(false);
            setAddrStreet('');
            setAddrError('');
        } else {
            setAddrError(res.error || 'Failed to save address.');
        }
    };

    const addresses: Address[] = user.addresses || [];

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="profile-modal-header">
                    <div className="profile-header-user">
                        <div className="profile-avatar">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h2 className="profile-modal-title">{user.name || 'My Account'}</h2>
                            <p className="profile-modal-email">{user.email}</p>
                        </div>
                    </div>
                    <button className="profile-close-btn" onClick={onClose} aria-label="Close Profile">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`profile-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('addresses')}
                    >
                        <MapPin size={16} />
                        <span>Saved Addresses ({addresses.length})</span>
                    </button>
                    <button
                        className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={16} />
                        <span>Personal Details</span>
                    </button>
                </div>

                {/* Content Body */}
                <div className="profile-modal-body">
                    {/* Addresses Tab */}
                    {activeTab === 'addresses' && (
                        <div className="addresses-tab-content">
                            <div className="addresses-top-action">
                                <div>
                                    <h3 className="section-heading">Delivery Addresses</h3>
                                    <p className="section-subtext">Manage your shipping destinations for 1-click checkout</p>
                                </div>
                                {!showAddForm && (
                                    <button
                                        type="button"
                                        className="add-address-btn"
                                        onClick={() => setShowAddForm(true)}
                                    >
                                        <Plus size={16} />
                                        <span>Add New Address</span>
                                    </button>
                                )}
                            </div>

                            {/* Add Address Form Accordion */}
                            {showAddForm && (
                                <form className="add-address-card" onSubmit={handleAddAddress}>
                                    <div className="add-address-header">
                                        <h4>Add New Delivery Address</h4>
                                        <button
                                            type="button"
                                            className="cancel-form-btn"
                                            onClick={() => setShowAddForm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {addrError && <div className="addr-error-banner">{addrError}</div>}

                                    <div className="label-selector">
                                        <span className="label-title">Address Type:</span>
                                        <div className="label-chips">
                                            {(['Home', 'Office', 'Other'] as const).map(lbl => (
                                                <button
                                                    key={lbl}
                                                    type="button"
                                                    className={`chip-btn ${addrLabel === lbl ? 'selected' : ''}`}
                                                    onClick={() => setAddrLabel(lbl)}
                                                >
                                                    {lbl === 'Home' && <Home size={13} />}
                                                    {lbl === 'Office' && <Briefcase size={13} />}
                                                    {lbl === 'Other' && <MapPin size={13} />}
                                                    {lbl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="input-group">
                                            <label>Recipient Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={addrFullName}
                                                onChange={e => setAddrFullName(e.target.value)}
                                                placeholder="Enter Recipient Name"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Contact Phone (Tamil Nadu Delivery) *</label>
                                            <input
                                                type="tel"
                                                required
                                                maxLength={10}
                                                value={addrPhone}
                                                onChange={e => setAddrPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                placeholder="Enter your phone number"
                                            />
                                            <span className="input-hint" style={{ fontSize: '0.75rem', color: '#64748b' }}>Must be a 10-digit mobile number</span>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>Flat, House No., Building, Apartment, Street *</label>
                                        <textarea
                                            required
                                            rows={2}
                                            value={addrStreet}
                                            onChange={e => setAddrStreet(e.target.value)}
                                            placeholder="Enter your street address"
                                        />
                                    </div>

                                    <div className="form-grid-3">
                                        <div className="input-group">
                                            <label>City / Town *</label>
                                            <input
                                                type="text"
                                                required
                                                value={addrCity}
                                                onChange={e => setAddrCity(e.target.value)}
                                                placeholder="Enter city or town"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>District / Area</label>
                                            <input
                                                type="text"
                                                value={addrDistrict}
                                                onChange={e => setAddrDistrict(e.target.value)}
                                                placeholder="Enter district or area"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Pincode *</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={addrPincode}
                                                onChange={e => setAddrPincode(e.target.value)}
                                                placeholder="Enter pincode"
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>State</label>
                                        <input
                                            type="text"
                                            value={addrState}
                                            onChange={e => setAddrState(e.target.value)}
                                            placeholder="Enter state"
                                        />
                                    </div>

                                    <label className="checkbox-row">
                                        <input
                                            type="checkbox"
                                            checked={addrIsDefault}
                                            onChange={e => setAddrIsDefault(e.target.checked)}
                                        />
                                        <span>Set as default delivery address</span>
                                    </label>

                                    <div className="form-action-row">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setShowAddForm(false)}
                                        >
                                            Discard
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={isSavingAddr}
                                        >
                                            {isSavingAddr ? 'Saving Address...' : 'Save & Deliver Here'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Saved Address Cards */}
                            {addresses.length === 0 && !showAddForm ? (
                                <div className="empty-addresses-state">
                                    <div className="empty-icon-wrap">
                                        <MapPin size={36} />
                                    </div>
                                    <h4>No Saved Addresses Yet</h4>
                                    <p>Add your home or office address to enjoy seamless 1-click checkout with fast Tamil Nadu delivery.</p>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => setShowAddForm(true)}
                                    >
                                        <Plus size={16} /> Add First Address
                                    </button>
                                </div>
                            ) : (
                                <div className="addresses-grid">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            className={`address-card ${addr.isDefault ? 'default-card' : ''}`}
                                        >
                                            <div className="address-card-header">
                                                <div className="address-label-badge">
                                                    {addr.label === 'Home' && <Home size={12} />}
                                                    {addr.label === 'Office' && <Briefcase size={12} />}
                                                    {addr.label !== 'Home' && addr.label !== 'Office' && <MapPin size={12} />}
                                                    <span>{addr.label || 'Home'}</span>
                                                </div>
                                                {addr.isDefault && (
                                                    <span className="default-pill">
                                                        <CheckCircle size={12} /> Default
                                                    </span>
                                                )}
                                            </div>

                                            <div className="address-card-body">
                                                <div className="addr-name">{addr.fullName}</div>
                                                <div className="addr-street">{addr.street}</div>
                                                <div className="addr-locality">
                                                    {addr.city}, {addr.district ? `${addr.district}, ` : ''}{addr.state} - <strong>{addr.pincode}</strong>
                                                </div>
                                                <div className="addr-phone">
                                                    <Phone size={13} /> {addr.phone}
                                                </div>
                                            </div>

                                            <div className="address-card-actions">
                                                {!addr.isDefault && (
                                                    <button
                                                        type="button"
                                                        className="make-default-btn"
                                                        onClick={() => setDefaultAddress(addr.id)}
                                                    >
                                                        Make Default
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="delete-addr-btn"
                                                    title="Delete this address"
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to remove this address?')) {
                                                            deleteAddress(addr.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="profile-tab-content">
                            <h3 className="section-heading">Personal Information</h3>
                            <p className="section-subtext">Update your customer contact profile for order updates and invoices</p>

                            {profileSuccessMsg && (
                                <div className="profile-success-banner">
                                    <CheckCircle size={16} />
                                    <span>{profileSuccessMsg}</span>
                                </div>
                            )}

                            <form className="profile-form" onSubmit={handleSaveProfile}>
                                <div className="input-group">
                                    <label>Registered Email</label>
                                    <div className="input-with-icon disabled">
                                        <Mail size={16} />
                                        <input type="email" value={user.email} disabled />
                                    </div>
                                    <span className="input-hint">Your email is linked to your VP Nuts orders</span>
                                </div>

                                <div className="input-group">
                                    <label>Full Name *</label>
                                    <div className="input-with-icon">
                                        <User size={16} />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Phone Number *</label>
                                    <div className="input-with-icon">
                                        <Phone size={16} />
                                        <input
                                            type="tel"
                                            required
                                            maxLength={10}
                                            value={phone}
                                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    <span className="input-hint" style={{ fontSize: '0.75rem', color: '#64748b' }}>10-digit mobile number for order delivery updates</span>
                                </div>

                                <div className="form-grid-2">
                                    <div className="input-group">
                                        <label>City / Town</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            placeholder="Enter your city"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>State</label>
                                        <input
                                            type="text"
                                            value={stateVal}
                                            onChange={e => setStateVal(e.target.value)}
                                            placeholder="Enter your state"
                                        />
                                    </div>
                                </div>

                                <div className="profile-privileges-box">
                                    <div className="privilege-header">
                                        <Sparkles size={16} className="sparkle-icon" />
                                        <strong>VP Nuts Member Privileges</strong>
                                    </div>
                                    <ul>
                                        <li>Instant 10% Festive Discount applied automatically</li>
                                        <li>Priority vacuum nitrogen sealed dispatch from Kumbakonam</li>
                                        <li>Express 24-48h delivery across all Tamil Nadu pin codes</li>
                                    </ul>
                                </div>

                                <div className="profile-form-footer">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isSavingProfile}
                                    >
                                        {isSavingProfile ? 'Saving...' : 'Update Profile Details'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
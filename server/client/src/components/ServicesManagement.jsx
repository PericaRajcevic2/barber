import React, { useState, useEffect } from 'react';
import './ManagementStyles.css';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 30,
    price: 0,
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingService 
        ? `/api/admin/services/${editingService._id}`
        : '/api/admin/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchServices();
        resetForm();
      } else {
        alert('Greška pri spremanju usluge');
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price,
      description: service.description,
      isActive: service.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Jeste li sigurni da želite obrisati ovu uslugu?')) {
      try {
        const response = await fetch(`/api/admin/services/${serviceId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchServices();
        } else {
          alert('Greška pri brisanju usluge');
        }
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      duration: 30,
      price: 0,
      description: '',
      isActive: true
    });
    setEditingService(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Učitavanje...</div>;
  }

  return (
    <div className="management-container">
      <div className="section-header">
        <h2>Upravljanje Uslugama</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Nova Usluga
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>{editingService ? 'Uredi uslugu' : 'Nova usluga'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Naziv usluge:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Trajanje (minute):</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min="15"
                    step="15"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cijena (€):</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Opis:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Aktivna usluga
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingService ? 'Spremi promjene' : 'Kreiraj uslugu'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Odustani
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="items-grid">
        {services.map((service) => (
          <div key={service._id} className="item-card">
            <div className="item-header">
              <h3>{service.name}</h3>
              <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                {service.isActive ? 'Aktivna' : 'Neaktivna'}
              </span>
            </div>
            
            <div className="item-details">
              <p><strong>Trajanje:</strong> {service.duration} minuta</p>
              <p><strong>Cijena:</strong> {service.price}€</p>
              {service.description && <p><strong>Opis:</strong> {service.description}</p>}
            </div>

            <div className="item-actions">
              <button
                onClick={() => handleEdit(service)}
                className="btn-edit"
              >
                Uredi
              </button>
              <button
                onClick={() => handleDelete(service._id)}
                className="btn-delete"
              >
                Obriši
              </button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="no-data">
          Nema kreiranih usluga. Kreiraj prvu uslugu!
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
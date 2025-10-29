import React, { useState, useEffect } from 'react';
import LazyImage from './LazyImage';
import './ManagementStyles.clean.css';
import api from '../utils/api';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 30,
    price: 0,
    description: '',
    image: 'https://images.unsplash.com/photo-1622287162716-277385e39a2f?w=800&auto=format&fit=crop',
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
  const { data } = await api.get('/api/admin/services');
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

      const response = await api({ url, method, data: formData, headers: { 'Content-Type': 'application/json' }, retryOnPost: true });

      if (response.status >= 200 && response.status < 300) {
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
      image: service.image || 'https://images.unsplash.com/photo-1622287162716-277385e39a2f?w=800&auto=format&fit=crop',
      isActive: service.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Jeste li sigurni da želite obrisati ovu uslugu?')) {
      try {
        const response = await api.delete(`/api/admin/services/${serviceId}`);

        if (response.status >= 200 && response.status < 300) {
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
      image: 'https://images.unsplash.com/photo-1622287162716-277385e39a2f?w=800&auto=format&fit=crop',
      isActive: true
    });
    setEditingService(null);
    setShowForm(false);
  };

  const handleDragStart = (e, service, index) => {
    setDraggingId(service._id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetService, targetIndex) => {
    e.preventDefault();
    
    if (!draggingId || draggingId === targetService._id) {
      setDraggingId(null);
      return;
    }

    const draggedIndex = services.findIndex(s => s._id === draggingId);
    const newServices = [...services];
    const [draggedItem] = newServices.splice(draggedIndex, 1);
    newServices.splice(targetIndex, 0, draggedItem);

    // Ažuriraj displayOrder
    const reorderedServices = newServices.map((s, idx) => ({
      _id: s._id,
      displayOrder: idx
    }));

    // Optimistički update UI
    setServices(newServices);
    setDraggingId(null);

    // Pošalji na server
    try {
      const response = await api.put('/api/services/reorder', { services: reorderedServices });

      if (!(response.status >= 200 && response.status < 300)) {
        // Rollback on error
        fetchServices();
      }
    } catch (error) {
      console.error('Error reordering services:', error);
      fetchServices();
    }
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
                  <label>Cijena (KM):</label>
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
                <label>URL slike:</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <div className="image-preview">
                    <LazyImage
                      src={formData.image}
                      alt="Preview"
                      style={{width: '100%', height: 'auto', display: 'block'}}
                    />
                  </div>
                )}
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
        {services.map((service, index) => (
          <div 
            key={service._id} 
            className={`item-card ${draggingId === service._id ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, service, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, service, index)}
          >
            {service.image && (
              <div className="service-image">
                <LazyImage src={service.image} alt={service.name} />
              </div>
            )}
            <div className="item-header">
              <h3>
                <span className="drag-handle">⋮⋮</span>
                {service.name}
              </h3>
              <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                {service.isActive ? 'Aktivna' : 'Neaktivna'}
              </span>
            </div>
            
            <div className="item-details">
              <p><strong>Trajanje:</strong> {service.duration} minuta</p>
              <p><strong>Cijena:</strong> {service.price} KM</p>
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
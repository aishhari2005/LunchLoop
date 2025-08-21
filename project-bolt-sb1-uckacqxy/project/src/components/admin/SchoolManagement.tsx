import React, { useState, useEffect } from 'react';
import { School, Plus, Edit2, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { School as SchoolType } from '../../types';
import toast from 'react-hot-toast';

export function SchoolManagement() {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    lunch_time_start: '12:00',
    lunch_time_end: '13:00',
    contact_person: '',
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setSchools(data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSchool) {
        const { error } = await supabase
          .from('schools')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSchool.id);
        
        if (error) throw error;
        toast.success('School updated successfully!');
      } else {
        const { error } = await supabase
          .from('schools')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
        
        if (error) throw error;
        toast.success('School added successfully!');
      }

      resetForm();
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save school');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (school: SchoolType) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address,
      phone: school.phone,
      email: school.email,
      lunch_time_start: school.lunch_time_start,
      lunch_time_end: school.lunch_time_end,
      contact_person: school.contact_person || '',
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (schoolId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', schoolId);

      if (error) throw error;
      toast.success(`School ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update school status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      lunch_time_start: '12:00',
      lunch_time_end: '13:00',
      contact_person: '',
    });
    setEditingSchool(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add School
        </Button>
      </div>

      {/* School Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <School className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <School className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Schools</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.filter(s => s.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Lunch Time</p>
                <p className="text-2xl font-bold text-gray-900">12:30 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit School Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSchool ? 'Edit School' : 'Add New School'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="School Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />

              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <Input
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Lunch Time Start"
                  type="time"
                  value={formData.lunch_time_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, lunch_time_start: e.target.value }))}
                  required
                />
                <Input
                  label="Lunch Time End"
                  type="time"
                  value={formData.lunch_time_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, lunch_time_end: e.target.value }))}
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingSchool ? 'Update School' : 'Add School'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Card key={school.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <School className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{school.name}</h3>
                    <p className={`text-sm ${school.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(school)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{school.address}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{school.phone}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{school.email}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {school.lunch_time_start} - {school.lunch_time_end}
                  </span>
                </div>
              </div>

              {school.contact_person && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700">Contact Person:</p>
                  <p className="text-sm text-gray-600">{school.contact_person}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  className="w-full" 
                  size="sm"
                  variant={school.is_active ? "outline" : "secondary"}
                  onClick={() => handleToggleStatus(school.id, school.is_active)}
                >
                  {school.is_active ? 'Deactivate' : 'Activate'} School
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schools added yet</h3>
            <p className="text-gray-600 mb-6">Add schools to start managing lunch deliveries</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First School
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
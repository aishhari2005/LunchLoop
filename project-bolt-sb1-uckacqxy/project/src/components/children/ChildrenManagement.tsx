import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, School, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Child, School as SchoolType } from '../../types';
import toast from 'react-hot-toast';

export function ChildrenManagement() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    school_id: '',
    allergies: '',
    special_notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [childrenResponse, schoolsResponse] = await Promise.all([
        supabase.from('children').select('*').eq('parent_id', user?.id),
        supabase.from('schools').select('*')
      ]);

      if (childrenResponse.data) setChildren(childrenResponse.data);
      if (schoolsResponse.data) setSchools(schoolsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const childData = {
        ...formData,
        parent_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingChild) {
        const { error } = await supabase
          .from('children')
          .update(childData)
          .eq('id', editingChild.id);
        
        if (error) throw error;
        toast.success('Child updated successfully!');
      } else {
        const { error } = await supabase
          .from('children')
          .insert([{ ...childData, created_at: new Date().toISOString() }]);
        
        if (error) throw error;
        toast.success('Child added successfully!');
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save child');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      class: child.class,
      school_id: child.school_id,
      allergies: child.allergies || '',
      special_notes: child.special_notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child profile?')) return;

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) throw error;
      toast.success('Child deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete child');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      class: '',
      school_id: '',
      allergies: '',
      special_notes: '',
    });
    setEditingChild(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Children</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Child
        </Button>
      </div>

      {/* Add/Edit Child Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingChild ? 'Edit Child' : 'Add New Child'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Child Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Class"
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                  placeholder="e.g., 5th Grade A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School
                </label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value }))}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Allergies"
                value={formData.allergies}
                onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                placeholder="e.g., Nuts, Dairy, etc."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Notes
                </label>
                <textarea
                  value={formData.special_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special instructions or notes about your child"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingChild ? 'Update Child' : 'Add Child'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Children List */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-6">Add your child's profile to start booking lunch deliveries</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const school = schools.find(s => s.id === child.school_id);
            return (
              <Card key={child.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-600">Class {child.class}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(child)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(child.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <School className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{school?.name || 'Unknown School'}</span>
                    </div>

                    {child.allergies && (
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-orange-700">Allergies:</p>
                          <p className="text-xs text-orange-600">{child.allergies}</p>
                        </div>
                      </div>
                    )}

                    {child.special_notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Special Notes:</p>
                        <p className="text-xs text-gray-600">{child.special_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => {
                        // Quick book functionality - would redirect to booking form with child pre-selected
                        window.dispatchEvent(new CustomEvent('quickBook', { detail: { childId: child.id } }));
                      }}
                    >
                      Quick Book Lunch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
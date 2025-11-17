"use client";
import React, { useState, useEffect } from 'react';

interface CalendarProps {
  appointments: any[];
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: any) => void;
  view: 'day' | 'week' | 'month';
  selectedDate: Date;
}

export default function Calendar({ appointments, onDateSelect, onAppointmentClick, view, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return '🩺';
      case 'follow-up': return '🔄';
      case 'emergency': return '🚨';
      case 'telemedicine': return '💻';
      default: return '📅';
    }
  };

  const formatTime = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = apt.scheduledFor?.toDate ? apt.scheduledFor.toDate() : new Date(apt.scheduledFor);
      return isSameDay(aptDate, date);
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
    onDateSelect(newDate);
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
        </div>
        <div className="p-4">
          {dayAppointments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📅</div>
              <div>No appointments scheduled</div>
            </div>
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => onAppointmentClick(appointment)}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md ${getStatusColor(appointment.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(appointment.type)}</span>
                      <div>
                        <div className="font-medium">{formatTime(appointment.scheduledFor)}</div>
                        <div className="text-sm">{appointment.reason}</div>
                      </div>
                    </div>
                    <div className="text-xs font-medium">
                      {appointment.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 gap-1 p-4">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className="min-h-32">
                <div className={`text-center p-2 rounded-t ${isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'}`}>
                  <div className="text-xs font-medium">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">{day.getDate()}</div>
                </div>
                <div className="p-1 space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => onAppointmentClick(appointment)}
                      className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(appointment.status)}`}
                    >
                      {formatTime(appointment.scheduledFor)}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayAppointments.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endOfMonth || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 gap-1 p-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={index}
                onClick={() => onDateSelect(day)}
                className={`min-h-20 p-1 cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'text-gray-300' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                      className={`text-xs p-1 rounded ${getStatusColor(appointment.status)}`}
                    >
                      {getTypeIcon(appointment.type)}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayAppointments.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {view === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        <button
          onClick={() => {
            setCurrentDate(new Date());
            onDateSelect(new Date());
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Today
        </button>
      </div>

      {/* Calendar Content */}
      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </div>
  );
}
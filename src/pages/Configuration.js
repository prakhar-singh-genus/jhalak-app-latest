import React, { useEffect, useState, useRef } from 'react';
import {
  CRow, CCol, CButton,
  CFormLabel,
  CCard,
  CCardBody
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import './Configuration.css';

// const ServerInfo = [
//   { id: 1, name: 'Genus RND' },
//   { id: 2, name: 'RCP Jaipur - 10.141.61.40' },
//   { id: 3, name: 'HDR 1101 - 10.133.100.21' },
//   { id: 4, name: 'HDR 1100 - 10.134.1.21' },
//   { id: 5, name: 'HDR 1201 - 10.133.1.22' },
//   { id: 6, name: 'Guhawati - 10.161.1.22' },
// ];

const ServerInfo = [
  { id: 1, name: 'Genus RND Server'},
  { id: 2, name: 'RCP Jaipur Server'},
  { id: 3, name: 'HDR 1101 Server'},
  { id: 4, name: 'HDR 1100 Server'},
  { id: 5, name: 'HDR 1201 Server'},
  { id: 6, name: 'Guhawati Server'},
];

const CPKParameterList = [
  { id: 1, name: 'PPM Value', state: false },
  { id: 2, name: 'Sup On', state: false },
  { id: 3, name: 'Sup Off', state: false },
  { id: 4, name: 'Bat On', state: false },
  { id: 5, name: 'Stage-1 TP 1', state: false },
  { id: 6, name: 'Stage-1 TP 2', state: false },
  { id: 7, name: 'Stage-1 TP 3', state: false },
  { id: 8, name: 'Stage-1 TP 4', state: false },
  { id: 9, name: 'Stage-1 TP 5', state: false },
  { id: 10, name: 'Stage-1 TP 6', state: false },
  { id: 11, name: 'Stage-1 TP 7', state: false },
  { id: 12, name: 'Stage-1 TP 8', state: false },
  { id: 13, name: 'Stage-1 TP 9', state: false },
  { id: 14, name: 'Stage-1 TP 10', state: false },
  { id: 15, name: 'Stage-1 TP 11', state: false },
  { id: 16, name: 'Stage-1 TP 12', state: false },
  { id: 17, name: 'Stage-2 TP 1', state: false },
  { id: 18, name: 'Stage-2 TP 2', state: false },
  { id: 19, name: 'Stage-2 TP 3', state: false },
  { id: 20, name: 'Stage-2 TP 4', state: false },
  { id: 21, name: 'Stage-2 TP 5', state: false },
  { id: 22, name: 'Stage-2 TP 6', state: false },
  { id: 23, name: 'Stage-2 TP 7', state: false },
  { id: 24, name: 'Stage-2 TP 8', state: false },
  { id: 25, name: 'Stage-2 TP 9', state: false },
  { id: 26, name: 'Stage-2 TP 10', state: false },
  { id: 27, name: 'Err_Ph LP 1', state: false },
  { id: 28, name: 'Err_Ph LP 2', state: false },
  { id: 29, name: 'Err_Ph LP 3', state: false },
  { id: 30, name: 'Err_Ph LP 4', state: false },
  { id: 31, name: 'Err_Ph LP 5', state: false },
  { id: 32, name: 'Err_Ph LP 6', state: false },
  { id: 33, name: 'Err_Ph LP 7', state: false },
  { id: 34, name: 'Err_Nu LP 1', state: false },
  { id: 35, name: 'Err_Nu LP 2', state: false },
  { id: 36, name: 'Err_Nu LP 3', state: false },
  { id: 37, name: 'Err_Nu LP 4', state: false },
  { id: 38, name: 'Err_Nu LP 5', state: false },
  { id: 39, name: 'Err_Nu LP 6', state: false },
  { id: 40, name: 'Err_Nu LP 7', state: false },
];

const ConfigurationSetting = () => {
  const navigate = useNavigate();
  const [server, setSelectedServer] = useState(2);
  const [cpkParameters, setSelectedParameters] = useState(CPKParameterList);

  // Ref for "Select All" checkbox to set indeterminate state
  const selectAllRef = useRef();

  useEffect(() => {
    const localdata = JSON.parse(localStorage.getItem('LocalData'));
    if (localdata) {
      setSelectedParameters(localdata);
    }
  }, []);

  useEffect(() => {
    if (selectAllRef.current) {
      const total = cpkParameters.length;
      const selectedCount = cpkParameters.filter(p => p.state).length;
      selectAllRef.current.indeterminate = selectedCount > 0 && selectedCount < total;
    }
  }, [cpkParameters]);

  //const handleServerChange = (event) => {
    //setSelectedServer(Number(event.target.value));
  //}
  const handleServerChange = (event) => {
  const selectedServerId = Number(event.target.value);
  setSelectedServer(selectedServerId);

  // Deselect all parameters when server changes
  setSelectedParameters(prev =>
    prev.map(param => ({ ...param, state: false }))
  );
};

  const toggleState = (id) => {
    setSelectedParameters(prev =>
      prev.map(param =>
        param.id === id ? { ...param, state: !param.state } : param
      )
    );
  };
  const toggleSelectAll = (checked) => {
    setSelectedParameters(prev => prev.map(param => ({ ...param, state: checked })));
  };
  const moveDashboard = () => {
    localStorage.setItem('LocalData', JSON.stringify(cpkParameters));
    localStorage.setItem('server', server);
    navigate('/dashboard', {
      state: {
        server,
        cpkParameters
      }
    });

  };

  
  // Calculate if all are selected
  const allSelected = cpkParameters.every(p => p.state);

return (
    <CCard>
      <CCardBody>
        <CRow className="mb-3">
          <CCol md="3">
            <CFormLabel>Monitoring Production:</CFormLabel>
          </CCol>
          <CCol xs="12" md="9">
            <select className="form-control" value={server} onChange={handleServerChange}>
              {ServerInfo.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </CCol>
        </CRow>

<CRow>
  <CCol md="3">
    <CFormLabel>Select CPK Parameters:</CFormLabel>
  </CCol>
  <CCol md="9">
    {/* Select All checkbox - separate container */}
    <div className="form-check mb-2">
      <input
        className="form-check-input"
        type="checkbox"
        checked={cpkParameters.every(p => p.state)}
        onChange={(e) => {
          const isChecked = e.target.checked;
          setSelectedParameters(prev =>
            prev.map(param => ({ ...param, state: isChecked }))
          );
        }}
      />
      <label className="form-check-label fw-bold">Select All</label>
    </div>

    {/* CPK Parameters list */}
    <div className="parameter-list">
      {cpkParameters.map((item) => (
        <div key={item.id} className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={item.state}
            onChange={() => toggleState(item.id)}
          />
          <label className="form-check-label">{item.name}</label>
        </div>
      ))}
    </div>
  </CCol>
</CRow>

        <div className="text-center mt-4">
          <CButton color="primary" onClick={moveDashboard}>
            Save Configuration
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ConfigurationSetting;

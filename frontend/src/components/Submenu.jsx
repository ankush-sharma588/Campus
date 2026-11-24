import PropTypes from 'prop-types';
import { useState } from "react";
import { Link } from "react-router-dom";

// Tailwind CSS classes will replace styled-components
const SidebarLink = ({ to, onClick, active, children, hasSubnav }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between w-full px-3 h-14 text-black text-lg no-underline hover:bg-slate-300 hover:border-l-4 hover:border-indigo-600 ${!hasSubnav ? 'hover:bg-slate-300 hover:border-l-4 hover:border-indigo-600' : ''} ${active ? 'bg-slate-300 border-l-4 border-indigo-600' : 'bg-transparent'}`}
  >
    {children}
  </Link>
);

const SidebarLabel = ({ children }) => (
  <span className="ml-3">{children}</span>
);

const DropdownLink = ({ to, active, children }) => (
  <Link
    to={to}
    className={`flex items-center h-12 pl-8 text-black text-lg no-underline hover:bg-slate-300 hover:border-l-4 hover:border-indigo-600 ${active ? 'bg-slate-300 border-l-4 border-indigo-600' : 'bg-transparent'}`}
  >
    {children}
  </Link>
);

const SubMenu = ({ item, currentPath }) => {
  const hasActiveSubItem = Boolean(item.subNav?.some((subItem) => currentPath.includes(subItem.path)));
  const [subnav, setSubnav] = useState(hasActiveSubItem);
  const showSubnav = () => setSubnav((current) => !current);

  return (
    <>
      <SidebarLink
        to={item.path}
        onClick={item.subNav && showSubnav}
        active={currentPath === item.path}
        hasSubnav={!!item.subNav}  // Pass whether it has subnav
      >
        <div className="flex items-center">
          {item.icon}
          <SidebarLabel>
            {item.title}
          </SidebarLabel>
        </div>
        <div>
          {item.subNav && subnav
            ? item.iconOpened
            : item.subNav
              ? item.iconClosed
              : null}
        </div>
      </SidebarLink>

      {subnav && (
        <div className="bg-gray-200">
          {item.subNav.map((subItem, index) => (
            <DropdownLink
              to={subItem.path}
              key={index}
              active={currentPath === subItem.path}
            >
              {subItem.icon}
              <SidebarLabel>
                {subItem.title}
              </SidebarLabel>
            </DropdownLink>
          ))}
        </div>
      )}
    </>
  );
};

export default SubMenu;

SidebarLink.propTypes = {
  to: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  active: PropTypes.bool,
  children: PropTypes.node,
  hasSubnav: PropTypes.bool,
};

SidebarLabel.propTypes = {
  children: PropTypes.node,
};

DropdownLink.propTypes = {
  to: PropTypes.string.isRequired,
  active: PropTypes.bool,
  children: PropTypes.node,
};

SubMenu.propTypes = {
  item: PropTypes.object.isRequired,
  currentPath: PropTypes.string.isRequired,
};

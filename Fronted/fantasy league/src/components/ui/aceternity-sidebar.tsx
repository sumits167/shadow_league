"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconX } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

type SidebarProps = Omit<React.ComponentProps<typeof motion.div>, "children"> & {
  children?: React.ReactNode;
};

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useAceternitySidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useAceternitySidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: SidebarProps) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: SidebarProps) => {
  const { open, setOpen, animate } = useAceternitySidebar();
  return (
    <motion.div
      className={cn(
        "sticky top-0 h-screen px-3 py-4 hidden md:flex md:flex-col bg-card border-r border-border w-[260px] flex-shrink-0 justify-between z-30 select-none overflow-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "68px") : "260px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: SidebarProps) => {
  const { open, setOpen } = useAceternitySidebar();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn(
            "fixed h-full w-full inset-0 bg-card p-6 z-[100] flex flex-col justify-between md:hidden border-r border-border",
            className
          )}
          {...props}
        >
          <div
            className="absolute right-6 top-6 z-50 text-foreground cursor-pointer p-2 rounded-lg bg-secondary hover:bg-secondary/80"
            onClick={() => setOpen(false)}
          >
            <IconX className="size-5" />
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const { open, setOpen, animate } = useAceternitySidebar();
  const isInternal = link.href.startsWith("/");

  const handleClick = (e: React.MouseEvent) => {
    setOpen(false);
    if (onClick) onClick(e);
  };

  const content = (
    <>
      <div className="size-5 flex items-center justify-center shrink-0">
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-foreground text-xs font-semibold whitespace-pre inline-block transition duration-150 shrink-0 overflow-hidden"
      >
        {link.label}
      </motion.span>
    </>
  );

  return isInternal ? (
    <Link
      to={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-2 px-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground overflow-hidden",
        className
      )}
      {...props}
    >
      {content}
    </Link>
  ) : (
    <a
      href={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-2 px-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground overflow-hidden",
        className
      )}
      {...props}
    >
      {content}
    </a>
  );
};

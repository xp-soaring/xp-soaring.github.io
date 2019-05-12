@echo.
@echo *********************************************************
@echo * This script uninstalls IPv6 support from this machine *
@echo *********************************************************
@echo.
@echo Press Ctrl+C to abort.
@pause

@netsh interface ipv6 uninstall

@echo.
@echo IPv6 uninstall process done.
@echo.
@pause
App Design Overview

Let’s build a MERN stack web app called “koi”. This is a general-purpose app targeted at companies that require an integrated platform on which they can do data entry, analytics, team collaboration, and reporting. My original aim was to build this for a pharma company, so I may make reference to clinical trials, but this should be broadly applicable across any sector. Once a user logs in, they will be taken to a landing page which shows the directory folder structure for their organization. Most likely, they will have separate folders for each project, and within those folders are ‘Workspaces’. A Workspace can be thought of as similar to a PowerPoint slide deck, in that it can have multiple pages. However, the content components on each page can not only be text, shapes, and images, but also functional Modules like forecasting tools, spreadsheets, interactive charts, forms, etc. Each of these Modules will be composed of modular “Cell” components. Multiple users can edit a workspace simultaneously, with the updates one user makes passed to the server and automatically reflected for other active users in that workspace.

Please first have a look over the ‘App Design Overview’ to understand the general purpose of the app, the structures utilized, and the intended functionality.

Next, review appOLD.js, cellOLD.js, and serverOLD.js to get a sense of the work I did on an older version of this app. I’d like to start from scratch here and build the app back up, one piece at a time. This old example doesn’t have to be followed strictly, I only include it as a reference. I’m open to new approaches generally, but am fairly committed to the idea of sticking with a simple approach using only app.js and cell.js. This is reflective of the fact that everything in the app is ultimately reducible to a Cell. If I start adding new components for things like toggle switches, etc. then it defeats the fundamental concept of the app.

Main App Structures

operations: List of operations to be executed, used to update content, data, and styling.

undo: Stack of operations for undo/redo functionality.

app: Holds the overall state of the application.

users: Collection of user records containing profile information.

organizations: Records that represent different organizations, each with their own database.

workspaces: Workspaces within organizations that hold multiple pages.

pages: Individual pages within workspaces that contain modules.

modules: Functional components on pages (e.g., charts, forms, spreadsheets).

cells: The fundamental building blocks that make up modules and other components.

Database

The MongoDB will be organized with a single Database containing Collections for each structure per Organization.  The Collections will be named after the organization id, e.g. org_662aaaa2f919a72819aa37bd_users

There will be some non-organization-specific Collections that need to be access generally e.g. app_users may be used to query a single centralized user list to confirm login validity. 

Login

Login screen: Initial screen where users provide credentials.

User logs in: Database called to confirm credentials.

Valid login: User’s ID is stored as activeUser in app state.

Load user record: User’s record is loaded into the users state.

Load organization: User’s organization record is loaded into the organizations state.

Set workspace: app.currentWorkspace is set to activeUser's default workspace.

Load default workspace: Load the user's organization’s landing page.

Load pages, modules, cells: Proceed to load pages from that workspace, then modules from those pages, and cells from those modules.

Users

User Records: Capture profile attributes like name, email, organization, etc.

Role Assignment: Users can be assigned different roles (e.g., Owner, Member, Reader).

Organizations

Database Structure: Each organization will have its own database in MongoDB, with segregated collections for data isolation.

Folders

Folder Collection: Each organization will have a folders collection to capture the nested file hierarchy.

Folder Contents: Folders may contain workspaces and files (e.g., documents, images). They will have properties to capture metadata such as creator and creation date.

Access

Access Levels: Folders and files will each have a members array property:

members: [ { userId: 'user123', access: 'owner' } ]

Three Access Levels:

Owner: The original user who creates an item will be assigned as owner by default (modifiable). Owners can access ‘design’ mode to modify page layouts, modules, and cells. Owners can also view and make edits to functional modules like a regular editor user. The only exception is if the workspace has its restriction property set to owner.

Member: Can view and make edits to functional modules in ‘live’ mode (e.g., update a form or a spreadsheet), but cannot access ‘design’ mode to modify page or module layouts.

Reader: User can view in ‘live’ mode only and cannot make any edits.

App UI

The app UI will feature 4 main elements. These will all be built using the app’s module/cell structure. Because these are app-level modules, separate from any particular workspace, they will not be editable by users in ‘design’ mode.

Top Panel: Also referred to as the ‘nav-bar’. Positioned at the top of the screen, 50px in height (not resizable). Displays koi logo on the left, and on the right side displays icons for toggling between live/design mode (only visible to owners), toggling visibility of the left and right panels, switching to full-screen view, and accessing the profile drop-down menu.

Left Panel: Also referred to as ‘page layout’. Displays a hierarchy tree view of workspace > pages > modules > cells, similar to MS PowerPoint’s outline view. Elements can be clicked, dragged, moved, or deleted. Contains a “Return to Main Menu” link, followed by the hierarchy of workspace components. Owners see the full layout; Members and Readers see a simpler version.

Right Panel: In ‘design’ mode, the right panel is a ‘config panel’ for modifying properties of selected pages, modules, or cells. In ‘live’ mode, it may function as a ‘filter panel’ (similar to Spotfire). The panel is horizontally resizable.

Canvas: The page surface in the center of the screen where modules are placed. Has 16:9 widescreen dimensions, similar to PowerPoint. Needs to dynamically resize based on the browser window size.

Operations

Operation List: A list of operations to be executed, which update content, data, and styling by modifying properties of main structures (primarily the cells struct) or by calling the database.

Operation Status: Operations are added with status ‘ready’ if they should be run immediately. Once run, they are set to ‘started’ (during which async actions may occur), and finally ‘completed’. Operations that depend on other operations default to a status of ‘pending’ and are promoted to ‘ready’ when all dependencies are completed.

Undo

Undo Stack: Undo history is captured in a list of operations. When an operation is executed, it is added to the undo list unless it only modifies the UI superficially (e.g., minimizing side panels).

Sequential Logging: Actions are logged sequentially, containing information for reversing (undo) and reapplying (redo) the change.

Undo/Redo Pointer: The stack has a pointer to track the current position for undo/redo actions. To undo, the most recent action is reversed, and the pointer moves back. To redo, the next action is applied, and the pointer moves forward.

Mouse Events

Click: A ‘click’ event will call the handleMouseDown function. This adds event operations with the click triggerType (e.g., a button click).

Drag: TriggerType drag operations are triggered by the initial mouse down event and capture the initial coordinates in the operation properties. If the user clicks inside a rowCell, it will capture the row and column coordinates of the cell. Subsequent mouse movements call handleMouseMove and capture the delta X and Y movement, which can be used for repositioning cells, resizing, or slider movement.

Key Events

Key Presses: Key presses call the handleKeyDown function. Operations may have triggerTypes like arrowKey to handle arrow key movement for navigating around a cell’s rows and columns. Special key events like ESC are also handled to close pop-ups or exit full-screen mode.

References

Reference Syntax: Objects in the main structures can be referred to using this syntax (bracketed values are: targetStruct, targetKey, targetProp):

[cells][tab1colheaders][columns[0].width]

Nested Properties: targetProp may contain nested properties like state.base.backgroundColor and array indices, as well as contextual reference variables like $index and $col, which refer to variables within a loop context.

Default Behavior: If targetStruct and/or targetKey are omitted, the app defaults to assuming that the reference refers to its own structure and key, making formulas more concise. For the app struct (which is an object instead of a map), the targetKey is not required.

Invalid References: An invalid reference should return #REF!

Formulas

Formula Syntax: Struct properties can be set using formulas, similar to Excel formulas but with different syntax. Formulas can apply to any property, not just cell content. They may include strings, numbers, references, functions, ranges, and Excel-style cell references.

=5 + 6

=sum(C1, C2, C3)

=moveCursor("tab1cells", "click", "coords")

=count([cells][tab1colheaders][columns[0].width]:[cells][tab1colheaders][columns[3].width])

Parsing

Tokenizer: Converts a formula string into individual tokens, including numbers, strings, operators, references, keywords, and functions. Handles nesting and complex syntax like cell references ([cells][tab1colheaders][columns[0].width]).

Parse Reference: Extracts the struct, key, and property paths from a reference string to evaluate the value of a reference (e.g., [cells][tab1colheaders][columns[0].width]).

Convert Formula: Uses the tokenizer, AST parsing, and evaluation to convert a formula into a calculated value. Supports arithmetic, logical conditions, and references to struct properties.

Parse Tokens: Builds an Abstract Syntax Tree (AST) from tokens to represent expressions, including if/else, arithmetic, function calls, and property access.

Evaluation: The AST nodes are evaluated to generate the final result, including handling nested expressions, function calls, and references within the state structures.

Supported Functions: Functions like sum(), count(), and moveCursor() are supported for calculations and state transitions, enabling dynamic and interactive UI behavior.

Render Cells

Cell Component: The fundamental building block of the app, where every element is treated as a "Cell".

State-Driven Styling: Styling of cells (e.g., width, height, positioning) is dynamically generated based on the current and base states (state['base'], state[currentState]). This includes hover states and alignment.

Rendering Logic: Renders a cell's content based on state properties or a formula if in the 'editing' state. Includes mechanisms to handle contentEditable for live editing.

Cursor and Selection Box: Cells support rendering cursor and selection boxes, which are dynamically updated based on mouse and keyboard events. These boxes assist in selecting cells, similar to spreadsheet behavior.

Recursive Child Rendering: Cells can contain child elements, which are recursively rendered. Each child inherits and modifies properties from the parent, allowing for modular layouts.

Mouse and Keyboard Events: Handles events like hover, drag, and clicks to dynamically update the cell states or trigger operations, enabling interactive features like resizing and cell content editing.

Module / Cell Movement & Resize

Live Mode:

 

The app needs to accommodate different scenarios.

In a table / spreadsheet context, the header rowCells may have their right edge activated for drag activities.  The user can drag to make the column wider or narrower.  The fixedWidth prop will determine behavior of neighbor cells.  If width is fixed, and the user expands the middle column, the column to the right will shrink in width in proportion to the expansion of the middle column to ensure that the overall width of the header row remains consistent.  If width is not fixed (like in a spreadsheet), then the column to the right will retain its width, and the total header row width will expand.